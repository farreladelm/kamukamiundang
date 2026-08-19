import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { parseFile } from "music-metadata";
import { db } from "@/lib/server/db";

const MAX_MUSIC_BYTES = 15 * 1024 * 1024;
const MAX_DURATION_SECONDS = 10 * 60;
type MusicMimeType = "audio/mpeg" | "audio/mp4";

class AudioValidationError extends Error {}

function getStorageRoot(storageRoot?: string) {
  const root = storageRoot ?? process.env.ASSET_STORAGE_DIR;
  if (!root || !isAbsolute(root)) throw new Error("ASSET_STORAGE_DIR must be an absolute path");
  return resolve(root);
}

function trackDirectory(storageRoot: string, storagePath: string) {
  const directory = resolve(storageRoot, ...storagePath.split("/"));
  if (!directory.startsWith(`${storageRoot}${process.platform === "win32" ? "\\" : "/"}`)) throw new Error("Invalid music storage path");
  return directory;
}

function detectMimeType(bytes: Buffer): MusicMimeType | null {
  if ((bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from("ID3"))) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return "audio/mpeg";
  if (bytes.length >= 12 && bytes.subarray(4, 8).equals(Buffer.from("ftyp")) && ["M4A ", "M4B ", "isom", "mp42"].includes(bytes.subarray(8, 12).toString("ascii"))) return "audio/mp4";
  return null;
}

function isExpectedFormat(mimeType: MusicMimeType, format: { container?: string; codec?: string; duration?: number; numberOfChannels?: number }) {
  if (!format.duration || format.duration > MAX_DURATION_SECONDS || !format.numberOfChannels) return false;
  return mimeType === "audio/mpeg"
    ? format.container?.includes("MPEG") && format.codec?.includes("Layer 3")
    : format.container === "MPEG-4" && format.codec?.includes("AAC");
}

async function writeTemporaryAudio(path: string, stream: AsyncIterable<Uint8Array>) {
  const file = await open(path, "wx");
  let byteSize = 0;
  let magicBytes = Buffer.alloc(0);
  try {
    for await (const chunk of stream) {
      const bytes = Buffer.from(chunk);
      byteSize += bytes.byteLength;
      if (byteSize > MAX_MUSIC_BYTES) throw new AudioValidationError();
      if (magicBytes.byteLength < 12) {
        magicBytes = Buffer.concat([magicBytes, bytes.subarray(0, 12 - magicBytes.byteLength)]);
      }
      await file.write(bytes);
    }
  } finally {
    await file.close();
  }
  const mimeType = detectMimeType(magicBytes);
  if (!mimeType) throw new AudioValidationError();
  return { byteSize, mimeType };
}

export async function uploadMusicLibraryTrack(input: { adminId: string; title: string; stream: AsyncIterable<Uint8Array>; storageRoot?: string }) {
  const title = input.title.trim();
  if (!title || title.length > 100) return { status: "invalid_audio" as const };

  const root = getStorageRoot(input.storageRoot);
  const trackId = randomUUID();
  const storagePath = `music-library/${trackId}`;
  const temporaryDirectory = join(root, ".tmp", `${trackId}.processing`);
  const finalDirectory = trackDirectory(root, storagePath);
  try {
    await db.musicLibraryTrack.create({ data: { id: trackId, title, uploadedByAdminId: input.adminId, storagePath } });
    await db.musicLibraryTrack.update({ where: { id: trackId }, data: { status: "PROCESSING" } });
    await mkdir(temporaryDirectory, { recursive: true });
    const temporaryPath = join(temporaryDirectory, "source.upload");
    const { byteSize, mimeType } = await writeTemporaryAudio(temporaryPath, input.stream);
    const metadata = await parseFile(temporaryPath, { duration: true, skipCovers: true });
    if (!isExpectedFormat(mimeType, metadata.format)) throw new AudioValidationError();
    const extension = mimeType === "audio/mpeg" ? "mp3" : "m4a";
    await rename(temporaryPath, join(temporaryDirectory, `track.${extension}`));
    await mkdir(resolve(finalDirectory, ".."), { recursive: true });
    await rename(temporaryDirectory, finalDirectory);
    const saved = await stat(join(finalDirectory, `track.${extension}`));
    await db.musicLibraryTrack.update({
      where: { id: trackId },
      data: { status: "READY", byteSize: BigInt(byteSize), metadata: { mimeType, durationSeconds: metadata.format.duration, codec: metadata.format.codec, storedByteSize: saved.size } },
    });
    return { status: "ready" as const, trackId };
  } catch (error) {
    await Promise.all([rm(temporaryDirectory, { recursive: true, force: true }), rm(finalDirectory, { recursive: true, force: true })]);
    await db.musicLibraryTrack.update({ where: { id: trackId }, data: { status: "FAILED", failureCode: "AUDIO_PROCESSING_FAILED" } }).catch(() => undefined);
    return { status: error instanceof AudioValidationError ? "invalid_audio" as const : "failed" as const };
  }
}

export async function getMusicLibraryTrack(trackId: string, storageRoot?: string) {
  const track = await db.musicLibraryTrack.findFirst({ where: { id: trackId, status: "READY" }, select: { storagePath: true, metadata: true } });
  const metadata = track?.metadata as { mimeType?: MusicMimeType } | null;
  if (!track || (metadata?.mimeType !== "audio/mpeg" && metadata?.mimeType !== "audio/mp4")) return null;
  try {
    const extension = metadata.mimeType === "audio/mpeg" ? "mp3" : "m4a";
    const file = await open(join(trackDirectory(getStorageRoot(storageRoot), track.storagePath), `track.${extension}`), "r");
    return { contentType: metadata.mimeType, stream: file.createReadStream({ autoClose: true }) };
  } catch { return null; }
}

export async function deleteMusicLibraryTrack(trackId: string, storageRoot?: string) {
  const track = await db.musicLibraryTrack.findFirst({ where: { id: trackId, status: { in: ["READY", "FAILED"] } }, select: { id: true, storagePath: true } });
  if (!track) return false;
  await db.musicLibraryTrack.update({ where: { id: track.id }, data: { status: "DELETED", deletedAt: new Date() } });
  await rm(trackDirectory(getStorageRoot(storageRoot), track.storagePath), { recursive: true, force: true });
  return true;
}
