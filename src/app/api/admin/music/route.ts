import { cookies } from "next/headers";
import { getAdminSession, ADMIN_SESSION_COOKIE } from "@/features/auth/session";
import { uploadMusicLibraryTrack } from "@/features/assets/music-library";

export const runtime = "nodejs";

async function* readRequestBody(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  let completed = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        completed = true;
        return;
      }
      yield value;
    }
  } finally {
    if (!completed) await reader.cancel("Audio upload stopped before request body completed").catch(() => undefined);
    reader.releaseLock();
  }
}

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies();
  const actor = await getAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!actor) return new Response(null, { status: 401 });

  const title = request.headers.get("x-track-title") ?? "";
  const contentLength = Number(request.headers.get("content-length"));
  if (!request.body) return new Response(null, { status: 400 });
  if (Number.isFinite(contentLength) && contentLength > 15 * 1024 * 1024) return new Response(null, { status: 413 });
  const result = await uploadMusicLibraryTrack({ adminId: actor.admin.id, title, stream: readRequestBody(request.body) });
  if (result.status === "ready") return Response.json({ trackId: result.trackId }, { status: 201 });
  if (result.status === "invalid_audio") return new Response(null, { status: 415 });
  return new Response(null, { status: 500 });
}
