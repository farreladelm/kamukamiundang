import {
  allowBasicShowroomEvent,
  parseBasicShowroomEvent,
  recordBasicShowroomEvent,
} from "@/features/analytics/basic-events";

export const runtime = "nodejs";

const maxBodyBytes = 1_024;

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return new Response(null, { status: 413 });
  }

  if (!allowBasicShowroomEvent()) {
    return new Response(null, { status: 429 });
  }

  let input: unknown;

  try {
    input = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const event = parseBasicShowroomEvent(input);

  if (!event) {
    return new Response(null, { status: 400 });
  }

  try {
    await recordBasicShowroomEvent(event);
  } catch {
    // Conversion remains available even if analytics storage is unavailable.
  }

  return new Response(null, { status: 204 });
}
