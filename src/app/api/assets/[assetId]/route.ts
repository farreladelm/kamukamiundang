import { Readable } from "node:stream";
import { requireCustomer } from "@/features/auth/policies";
import {
  deleteImageAssetForCustomer,
  getImageVariantForCustomer,
  type ImageVariant,
} from "@/features/assets/image-service";

export const runtime = "nodejs";

type AssetRouteContext = { params: Promise<{ assetId: string }> };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: AssetRouteContext): Promise<Response> {
  let customerId: string;
  try {
    ({ customer: { id: customerId } } = await requireCustomer());
  } catch {
    return new Response(null, { status: 401 });
  }

  const variant = new URL(request.url).searchParams.get("variant") ?? "display";
  if (variant !== "display" && variant !== "thumbnail") return new Response(null, { status: 400 });

  const { assetId } = await context.params;
  if (!UUID_PATTERN.test(assetId)) return new Response(null, { status: 404 });
  const asset = await getImageVariantForCustomer({
    customerId,
    assetId,
    variant: variant as ImageVariant,
  });
  if (!asset) return new Response(null, { status: 404 });

  return new Response(Readable.toWeb(asset.stream) as ReadableStream, {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(_request: Request, context: AssetRouteContext): Promise<Response> {
  let customerId: string;
  try {
    ({ customer: { id: customerId } } = await requireCustomer());
  } catch {
    return new Response(null, { status: 401 });
  }

  const { assetId } = await context.params;
  if (!UUID_PATTERN.test(assetId)) return new Response(null, { status: 404 });
  const result = await deleteImageAssetForCustomer({ customerId, assetId });
  if (result.status === "deleted") return new Response(null, { status: 204 });
  if (result.status === "published_reference") return new Response(null, { status: 409 });
  return new Response(null, { status: 404 });
}
