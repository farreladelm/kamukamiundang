import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { wishSubmissionSchema } from "@/features/forms/schemas";
import { WishSubmissionError, submitWish } from "@/features/invitations/wish";

export const runtime = "nodejs";

const maxBodyBytes = 8 * 1024;
const idempotencyKeyPattern = /^[A-Za-z0-9._~-]{8,128}$/;
const wishClientCookieName = "undango_wish_client";
const wishClientCookieMaxAge = 24 * 60 * 60;
const wishClientSecret = randomBytes(32);

function signClientId(clientId: string) {
  return createHmac("sha256", wishClientSecret).update(clientId).digest("hex");
}

function getCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie")?.split(";") ?? [];
  const prefix = `${name}=`;
  return cookies.find((cookie) => cookie.trim().startsWith(prefix))?.trim().slice(prefix.length);
}

function getClientIdentity(request: Request) {
  const value = getCookie(request, wishClientCookieName);
  const [clientId, signature] = value?.split(".") ?? [];
  if (clientId && signature && /^[0-9a-f-]{36}$/.test(clientId) && /^[0-9a-f]{64}$/.test(signature)) {
    const expected = Buffer.from(signClientId(clientId), "hex");
    const actual = Buffer.from(signature, "hex");
    if (actual.length === expected.length && timingSafeEqual(actual, expected)) {
      return { clientKey: clientId, setCookie: undefined };
    }
  }

  const nextClientId = randomUUID();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    clientKey: nextClientId,
    setCookie: `${wishClientCookieName}=${nextClientId}.${signClientId(nextClientId)}; Path=/; Max-Age=${wishClientCookieMaxAge}; HttpOnly; SameSite=Lax${secure}`,
  };
}

function responseWithClientCookie(response: Response, setCookie: string | undefined) {
  if (setCookie) response.headers.set("Set-Cookie", setCookie);
  return response;
}

function errorResponse(message: string, status: number, setCookie?: string) {
  return responseWithClientCookie(Response.json({ message }, { status }), setCookie);
}

async function readBoundedBody(request: Request): Promise<string | null> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) return null;

  if (!request.body) {
    const text = await request.text();
    return new TextEncoder().encode(text).byteLength > maxBodyBytes ? null : text;
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBodyBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!idempotencyKeyPattern.test(idempotencyKey)) {
    return errorResponse("Header idempotensi tidak valid.", 400);
  }

  const bodyText = await readBoundedBody(request);
  if (bodyText === null) return errorResponse("Permintaan terlalu besar.", 413);

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse("Body bukan JSON yang sah.", 400);
  }

  const parsed = wishSubmissionSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Periksa data ucapan.", 400);

  const { slug } = await params;
  const { clientKey, setCookie } = getClientIdentity(request);

  try {
    const result = await submitWish({ slug, idempotencyKey, clientKey, submission: parsed.data });
    return responseWithClientCookie(Response.json(
      { ok: true, duplicate: result.status === "duplicate" },
      { status: result.status === "duplicate" ? 200 : 201 },
    ), setCookie);
  } catch (error) {
    if (!(error instanceof WishSubmissionError)) return errorResponse("Ucapan gagal disimpan.", 500, setCookie);
    if (error.code === "not_found") return errorResponse("Invitation tidak tersedia.", 404, setCookie);
    if (error.code === "rate_limited") return errorResponse(error.message, 429, setCookie);
    return errorResponse(error.message, 422, setCookie);
  }
}
