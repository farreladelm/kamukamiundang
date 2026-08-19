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
  return new Response(Readable.toWeb(track.stream) as ReadableStream, { headers: { "Content-Type": track.contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  if (!await requireApiAdmin()) return new Response(null, { status: 401 });
  const { trackId } = await context.params;
  if (!UUID_PATTERN.test(trackId)) return new Response(null, { status: 404 });
  return await deleteMusicLibraryTrack(trackId) ? new Response(null, { status: 204 }) : new Response(null, { status: 404 });
}
