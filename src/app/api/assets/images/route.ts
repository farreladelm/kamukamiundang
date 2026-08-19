import { requireCustomer } from "@/features/auth/policies";
import {
  allowCustomerImageUpload,
  uploadImageAssetForCustomer,
} from "@/features/assets/image-service";

export const runtime = "nodejs";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function* readRequestBody(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request): Promise<Response> {
  let customerId: string;
  try {
    ({ customer: { id: customerId } } = await requireCustomer());
  } catch {
    return new Response(null, { status: 401 });
  }

  const invitationId = request.headers.get("x-invitation-id");
  const contentLength = Number(request.headers.get("content-length"));
  if (!invitationId || !request.body) return new Response(null, { status: 400 });
  if (!UUID_PATTERN.test(invitationId)) return new Response(null, { status: 404 });
  if (Number.isFinite(contentLength) && contentLength > 10 * 1024 * 1024) {
    return new Response(null, { status: 413 });
  }
  if (!allowCustomerImageUpload(customerId)) return new Response(null, { status: 429 });

  const result = await uploadImageAssetForCustomer({
    customerId,
    invitationId,
    stream: readRequestBody(request.body),
  });

  if (result.status === "ready") return Response.json({ assetId: result.assetId }, { status: 201 });
  if (result.status === "invalid_image") return new Response(null, { status: 415 });
  if (result.status === "unavailable") return new Response(null, { status: 404 });
  if (result.status === "photo_limit" || result.status === "quota_exceeded") return new Response(null, { status: 422 });
  return new Response(null, { status: 500 });
}
