import "server-only";

import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, readdir, rename, rm, stat } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import sharp from "sharp";
import { db } from "@/lib/server/db";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2560;
const DISPLAY_WIDTH = 1600;
const THUMBNAIL_WIDTH = 480;
const MAX_UPLOADS_PER_MINUTE = 10;
const STALE_TEMPORARY_FILE_MS = 24 * 60 * 60 * 1000;
const uploadAttemptsByCustomer = new Map<string, number[]>();

export type ImageVariant = "display" | "thumbnail";

type UploadResult =
  | { status: "ready"; assetId: string }
  | { status: "invalid_image" | "photo_limit" | "unavailable" | "failed" | "quota_exceeded" };

type UploadImageInput = {
  customerId: string;
  invitationId: string;
  bytes?: Buffer;
  stream?: AsyncIterable<Uint8Array>;
  storageRoot?: string;
};

type AssetFile = {
  contentType: "image/webp";
  stream: ReturnType<typeof createReadStream>;
};

class ImageValidationError extends Error {
  constructor() {
    super("Invalid image");
  }
}

export function allowCustomerImageUpload(customerId: string, now = Date.now()) {
  const attempts = (uploadAttemptsByCustomer.get(customerId) ?? [])
    .filter((timestamp) => now - timestamp < 60_000);
  if (attempts.length >= MAX_UPLOADS_PER_MINUTE) return false;
  attempts.push(now);
  uploadAttemptsByCustomer.set(customerId, attempts);
  return true;
}

function getStorageRoot(storageRoot?: string) {
  const root = storageRoot ?? process.env.ASSET_STORAGE_DIR;
  if (!root || !isAbsolute(root)) throw new Error("ASSET_STORAGE_DIR must be an absolute path");
  return resolve(root);
}

function hasAllowedImageMagicBytes(bytes: Buffer) {
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8
    && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = bytes.length >= 12
    && bytes.subarray(0, 4).equals(Buffer.from("RIFF"))
    && bytes.subarray(8, 12).equals(Buffer.from("WEBP"));

  return isJpeg || isPng || isWebp;
}

function imageDirectory(storageRoot: string, storagePath: string) {
  const directory = resolve(storageRoot, ...storagePath.split("/"));
  if (!directory.startsWith(`${storageRoot}${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new Error("Invalid asset storage path");
  }
  return directory;
}

async function writeTemporaryUpload(
  storageRoot: string,
  input: Pick<UploadImageInput, "bytes" | "stream">,
) {
  if (!input.bytes && !input.stream) throw new ImageValidationError();
  const temporaryDirectory = join(storageRoot, ".tmp");
  await mkdir(temporaryDirectory, { recursive: true });
  const temporaryPath = join(temporaryDirectory, `${randomUUID()}.upload`);
  const temporaryFile = await open(temporaryPath, "wx");
  try {
    let byteSize = 0;
    let magicBytes = Buffer.alloc(0);
    const source = input.stream ?? [input.bytes as Buffer];

    for await (const chunk of source) {
      const bytes = Buffer.from(chunk);
      byteSize += bytes.byteLength;
      if (byteSize > MAX_IMAGE_BYTES) throw new ImageValidationError();
      if (magicBytes.byteLength < 12) {
        magicBytes = Buffer.concat([magicBytes, bytes.subarray(0, 12 - magicBytes.byteLength)]);
      }
      await temporaryFile.write(bytes);
    }
    if (!hasAllowedImageMagicBytes(magicBytes)) throw new ImageValidationError();
  } catch (error) {
    await temporaryFile.close().catch(() => undefined);
    await rm(temporaryPath, { force: true });
    throw error;
  }
  await temporaryFile.close();
  return temporaryPath;
}

async function reserveImageAsset(input: {
  customerId: string;
  invitationId: string;
  assetId: string;
  storagePath: string;
}) {
  return db.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT 1 FROM "Invitation" WHERE "id" = ${input.invitationId} FOR UPDATE`;

    const invitation = await transaction.invitation.findFirst({
      where: {
        id: input.invitationId,
        customerId: input.customerId,
        editingEnabled: true,
        status: { not: "ARCHIVED" },
      },
      select: { id: true, order: { select: { photoLimit: true } } },
    });
    if (!invitation) return { status: "unavailable" as const };

    const activePhotoCount = await transaction.asset.count({
      where: {
        invitationId: invitation.id,
        type: "IMAGE",
        status: { in: ["PENDING", "PROCESSING", "READY"] },
      },
    });
    if (activePhotoCount >= invitation.order.photoLimit) return { status: "photo_limit" as const };

    await transaction.asset.create({
      data: {
        id: input.assetId,
        invitationId: invitation.id,
        type: "IMAGE",
        storagePath: input.storagePath,
      },
    });
    return { status: "reserved" as const };
  });
}

async function createImageVariants(temporaryPath: string, destination: string) {
  const metadata = await sharp(temporaryPath, { limitInputPixels: MAX_IMAGE_DIMENSION ** 2 }).metadata();
  const width = metadata.autoOrient?.width ?? metadata.width;
  const height = metadata.autoOrient?.height ?? metadata.height;

  if (
    !width
    || !height
    || width > MAX_IMAGE_DIMENSION
    || height > MAX_IMAGE_DIMENSION
    || !["jpeg", "png", "webp"].includes(metadata.format ?? "")
  ) {
    throw new ImageValidationError();
  }

  await mkdir(destination, { recursive: true });
  const [displayInfo, thumbnailInfo] = await Promise.all([
    sharp(temporaryPath)
      .rotate()
      .resize({ width: DISPLAY_WIDTH, height: DISPLAY_WIDTH, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(destination, "display.webp")),
    sharp(temporaryPath)
      .rotate()
      .resize({ width: THUMBNAIL_WIDTH, height: THUMBNAIL_WIDTH, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 76 })
      .toFile(join(destination, "thumbnail.webp")),
  ]);

  const [display, thumbnail] = await Promise.all([
    stat(join(destination, "display.webp")),
    stat(join(destination, "thumbnail.webp")),
  ]);

  return {
    byteSize: BigInt(display.size + thumbnail.size),
    metadata: {
      width,
      height,
      inputFormat: metadata.format,
      variants: {
        display: { width: displayInfo.width, height: displayInfo.height, byteSize: display.size },
        thumbnail: { width: thumbnailInfo.width, height: thumbnailInfo.height, byteSize: thumbnail.size },
      },
    },
  };
}

function isQuotaError(error: unknown) {
  return error instanceof Error && error.message.includes("ready asset quota exceeded");
}

function isPublishedReferenceError(error: unknown) {
  return error instanceof Error && error.message.includes("published snapshot asset cannot be deleted");
}

export async function uploadImageAssetForCustomer(input: UploadImageInput): Promise<UploadResult> {
  let storageRoot: string;
  let temporaryPath: string | undefined;
  let finalDirectory: string | undefined;
  let processingDirectory: string | undefined;
  let assetId: string | undefined;

  try {
    storageRoot = getStorageRoot(input.storageRoot);
    await reconcileImageStorage(storageRoot);
    temporaryPath = await writeTemporaryUpload(storageRoot, input);
  } catch (error) {
    if (error instanceof ImageValidationError) return { status: "invalid_image" };
    throw error;
  }

  try {
    assetId = randomUUID();
    const storagePath = `${input.invitationId}/images/${assetId}`;
    const reservation = await reserveImageAsset({
      customerId: input.customerId,
      invitationId: input.invitationId,
      assetId,
      storagePath,
    });
    if (reservation.status !== "reserved") return reservation;

    await db.asset.update({ where: { id: assetId }, data: { status: "PROCESSING" } });

    finalDirectory = imageDirectory(storageRoot, storagePath);
    processingDirectory = join(storageRoot, ".tmp", `${assetId}.processing`);
    const processed = await createImageVariants(temporaryPath, processingDirectory);
    await mkdir(resolve(finalDirectory, ".."), { recursive: true });
    await rename(processingDirectory, finalDirectory);
    processingDirectory = undefined;

    await db.asset.update({
      where: { id: assetId },
      data: {
        status: "READY",
        byteSize: processed.byteSize,
        metadata: processed.metadata,
      },
    });
    return { status: "ready", assetId };
  } catch (error) {
    await Promise.all([
      processingDirectory ? rm(processingDirectory, { recursive: true, force: true }) : Promise.resolve(),
      finalDirectory ? rm(finalDirectory, { recursive: true, force: true }) : Promise.resolve(),
    ]);
    if (assetId) {
      await db.asset.update({
        where: { id: assetId },
        data: { status: "FAILED", failureCode: isQuotaError(error) ? "QUOTA_EXCEEDED" : "IMAGE_PROCESSING_FAILED" },
      }).catch(() => undefined);
    }
    if (isQuotaError(error)) return { status: "quota_exceeded" };
    return { status: "failed" };
  } finally {
    if (temporaryPath) await rm(temporaryPath, { force: true }).catch(() => undefined);
  }
}

export async function getImageVariantForCustomer(input: {
  customerId: string;
  assetId: string;
  variant: ImageVariant;
  storageRoot?: string;
}): Promise<AssetFile | null> {
  const asset = await db.asset.findFirst({
    where: {
      id: input.assetId,
      type: "IMAGE",
      status: "READY",
      invitation: {
        customerId: input.customerId,
        editingEnabled: true,
        status: { not: "ARCHIVED" },
      },
    },
    select: { storagePath: true },
  });
  if (!asset) return null;

  const filePath = join(imageDirectory(getStorageRoot(input.storageRoot), asset.storagePath), `${input.variant}.webp`);
  try {
    const file = await open(filePath, "r");
    return {
      contentType: "image/webp",
      stream: file.createReadStream({ autoClose: true }),
    };
  } catch {
    return null;
  }
}

export async function deleteImageAssetForCustomer(input: {
  customerId: string;
  assetId: string;
  storageRoot?: string;
}): Promise<{ status: "deleted" | "unavailable" | "published_reference" }> {
  const asset = await db.asset.findFirst({
    where: {
      id: input.assetId,
      type: "IMAGE",
      status: { in: ["READY", "FAILED"] },
      invitation: {
        customerId: input.customerId,
        editingEnabled: true,
        status: { not: "ARCHIVED" },
      },
    },
    select: { id: true, storagePath: true },
  });
  if (!asset) return { status: "unavailable" };

  if (await db.snapshotAsset.count({ where: { assetId: asset.id } })) {
    return { status: "published_reference" };
  }

  try {
    await db.asset.update({ where: { id: asset.id }, data: { status: "DELETED", deletedAt: new Date() } });
  } catch (error) {
    if (isPublishedReferenceError(error)) return { status: "published_reference" };
    throw error;
  }

  await rm(imageDirectory(getStorageRoot(input.storageRoot), asset.storagePath), { recursive: true, force: true });
  return { status: "deleted" };
}

export async function reconcileImageStorage(storageRoot?: string) {
  const root = getStorageRoot(storageRoot);
  const temporaryDirectory = join(root, ".tmp");
  const staleBefore = new Date(Date.now() - STALE_TEMPORARY_FILE_MS);
  const staleInFlight = await db.asset.findMany({
    where: {
      type: "IMAGE",
      status: { in: ["PENDING", "PROCESSING"] },
      updatedAt: { lt: staleBefore },
    },
    select: { id: true, storagePath: true },
  });
  const staleInFlightPaths: string[] = [];
  for (const asset of staleInFlight) {
    const result = await db.asset.updateMany({
      where: {
        id: asset.id,
        status: { in: ["PENDING", "PROCESSING"] },
        updatedAt: { lt: staleBefore },
      },
      data: { status: "FAILED", failureCode: "STALE_PROCESSING" },
    });
    if (result.count === 1) staleInFlightPaths.push(asset.storagePath);
  }
  const staleAssets = await db.asset.findMany({
    where: { type: "IMAGE", status: { in: ["FAILED", "DELETED"] } },
    select: { storagePath: true },
  });

  await Promise.all([...new Set([
    ...staleAssets.map((asset) => asset.storagePath),
    ...staleInFlightPaths,
  ])].map((storagePath) => rm(imageDirectory(root, storagePath), { recursive: true, force: true })));
  const now = Date.now();
  const temporaryEntries = await readdir(temporaryDirectory).catch(() => []);
  await Promise.all(temporaryEntries.map(async (entry) => {
    const entryPath = join(temporaryDirectory, entry);
    const entryStats = await stat(entryPath).catch(() => null);
    if (entryStats && now - entryStats.mtimeMs >= STALE_TEMPORARY_FILE_MS) {
      await rm(entryPath, { recursive: true, force: true });
    }
  }));
}
