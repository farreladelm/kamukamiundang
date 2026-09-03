import { rsvpSubmissionSchema } from "@/features/forms/schemas";
import { RsvpSubmissionError, submitRsvp } from "@/features/invitations/rsvp";

export const runtime = "nodejs";

const maxBodyBytes = 8 * 1024;
const idempotencyKeyPattern = /^[A-Za-z0-9._~-]{8,128}$/;

function errorResponse(message: string, status: number) {
  return Response.json({ message }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return errorResponse("Permintaan terlalu besar.", 413);
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!idempotencyKeyPattern.test(idempotencyKey)) {
    return errorResponse("Header idempotensi tidak valid.", 400);
  }

  const bodyText = await request.text();
  if (bodyText.length > maxBodyBytes) return errorResponse("Permintaan terlalu besar.", 413);

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse("Body bukan JSON yang sah.", 400);
  }

  const parsed = rsvpSubmissionSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Periksa data RSVP.", 400);

  const { slug } = await params;
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientKey = forwardedFor || request.headers.get("x-real-ip")?.trim() || "unknown";

  try {
    const result = await submitRsvp({ slug, idempotencyKey, clientKey, submission: parsed.data });
    return Response.json(
      { ok: true, duplicate: result.status === "duplicate" },
      { status: result.status === "ignored" ? 201 : result.status === "duplicate" ? 200 : 201 },
    );
  } catch (error) {
    if (!(error instanceof RsvpSubmissionError)) return errorResponse("RSVP gagal disimpan.", 500);
    if (error.code === "not_found") return errorResponse("Invitation tidak tersedia.", 404);
    if (error.code === "rate_limited") return errorResponse(error.message, 429);
    if (error.code === "capacity") return errorResponse(error.message, 409);
    return errorResponse(error.message, 422);
  }
}
