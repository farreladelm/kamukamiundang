// @vitest-environment node

import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireCustomer, deleteImageAssetForCustomer, getImageVariantForCustomer } = vi.hoisted(() => ({
  requireCustomer: vi.fn(),
  deleteImageAssetForCustomer: vi.fn(),
  getImageVariantForCustomer: vi.fn(),
}));

vi.mock("@/features/auth/policies", () => ({ requireCustomer }));
vi.mock("@/features/assets/image-service", () => ({
  deleteImageAssetForCustomer,
  getImageVariantForCustomer,
}));

import { DELETE, GET } from "./route";

const assetId = "31d7477f-ef1d-489a-a9c7-b217e6ef4915";
const context = { params: Promise.resolve({ assetId }) };

describe("GET and DELETE /api/assets/[assetId]", () => {
  beforeEach(() => {
    requireCustomer.mockReset();
    deleteImageAssetForCustomer.mockReset();
    getImageVariantForCustomer.mockReset();
    requireCustomer.mockResolvedValue({ customer: { id: "customer-1" } });
  });

  it("delivers only a validated variant with private, nosniff headers", async () => {
    getImageVariantForCustomer.mockResolvedValue({
      contentType: "image/webp",
      stream: Readable.from(Buffer.from("webp")),
    });

    const response = await GET(new Request(`https://undango.example/api/assets/${assetId}?variant=thumbnail`), context);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.text()).resolves.toBe("webp");
  });

  it("rejects unknown variants without resolving a file path", async () => {
    const response = await GET(new Request(`https://undango.example/api/assets/${assetId}?variant=../../secret`), context);

    expect(response.status).toBe(400);
    expect(getImageVariantForCustomer).not.toHaveBeenCalled();
  });

  it("treats malformed asset IDs as not found", async () => {
    await expect(GET(new Request("https://undango.example/api/assets/not-a-uuid"), {
      params: Promise.resolve({ assetId: "not-a-uuid" }),
    })).resolves.toMatchObject({ status: 404 });
    await expect(DELETE(new Request("https://undango.example/api/assets/not-a-uuid", { method: "DELETE" }), {
      params: Promise.resolve({ assetId: "not-a-uuid" }),
    })).resolves.toMatchObject({ status: 404 });
  });

  it("reports a published reference conflict instead of deleting the asset", async () => {
    deleteImageAssetForCustomer.mockResolvedValue({ status: "published_reference" });

    await expect(DELETE(new Request(`https://undango.example/api/assets/${assetId}`, { method: "DELETE" }), context))
      .resolves.toMatchObject({ status: 409 });
  });
});
