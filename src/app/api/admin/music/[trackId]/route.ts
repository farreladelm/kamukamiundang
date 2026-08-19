import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { cookies } from "next/headers";
import { getAdminSession, ADMIN_SESSION_COOKIE } from "@/features/auth/session";
import { deleteMusicLibraryTrack, getMusicLibraryTrack } from "@/features/assets/music-library";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ trackId: string }> };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireApiAdmin() {
  const cookieStore = await cookies();
  return getAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  if (!await requireApiAdmin()) return new Response(null, { status: 401 });
  const { trackId } = await context.params;
  if (!UUID_PATTERN.test(trackId)) return new Response(null, { status: 404 });
  const track = await getMusicLibraryTrack(trackId);
  if (!track) return new Response(null, { status: 404 });
  const range = _request.headers.get("range");
  let start = 0;
  let end = track.byteSize - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${track.byteSize}` } });
    start = match[1] ? Number(match[1]) : Math.max(track.byteSize - Number(match[2]), 0);
    end = match[2] ? Number(match[2]) : track.byteSize - 1;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= track.byteSize) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${track.byteSize}` } });
    }
    end = Math.min(end, track.byteSize - 1);
  }
  const stream = createReadStream(track.path, { start, end });
  const headers = {
    "Content-Type": track.contentType,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    "Content-Length": String(end - start + 1),
    ...(range ? { "Content-Range": `bytes ${start}-${end}/${track.byteSize}` } : {}),
  };
  return new Response(Readable.toWeb(stream) as ReadableStream, { status: range ? 206 : 200, headers });
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  if (!await requireApiAdmin()) return new Response(null, { status: 401 });
  const { trackId } = await context.params;
  if (!UUID_PATTERN.test(trackId)) return new Response(null, { status: 404 });
  return await deleteMusicLibraryTrack(trackId) ? new Response(null, { status: 204 }) : new Response(null, { status: 404 });
}
