// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireCustomer, allowCustomerImageUpload, uploadImageAssetForCustomer } = vi.hoisted(() => ({
  requireCustomer: vi.fn(),
  allowCustomerImageUpload: vi.fn(),
  uploadImageAssetForCustomer: vi.fn(),
}));

vi.mock("@/features/auth/policies", () => ({ requireCustomer }));
vi.mock("@/features/assets/image-service", () => ({
  allowCustomerImageUpload,
  uploadImageAssetForCustomer,
}));

import { POST } from "./route";

const invitationId = "31d7477f-ef1d-489a-a9c7-b217e6ef4915";

describe("POST /api/assets/images", () => {
  beforeEach(() => {
    requireCustomer.mockReset();
    allowCustomerImageUpload.mockReset();
    uploadImageAssetForCustomer.mockReset();
    requireCustomer.mockResolvedValue({ customer: { id: "customer-1" } });
    allowCustomerImageUpload.mockReturnValue(true);
  });

  it("rejects unauthenticated uploads", async () => {
    requireCustomer.mockRejectedValue(new Error("No customer session"));

    await expect(POST(new Request("https://undango.example/api/assets/images", { method: "POST" })))
      .resolves.toMatchObject({ status: 401 });
  });

  it("rejects body lengths above the image limit before reading the upload", async () => {
    const response = await POST(new Request("https://undango.example/api/assets/images", {
      method: "POST",
      headers: { "x-invitation-id": invitationId, "content-length": String(10 * 1024 * 1024 + 1) },
      body: "ignored",
    }));

    expect(response.status).toBe(413);
    expect(uploadImageAssetForCustomer).not.toHaveBeenCalled();
  });

  it("streams a raw upload for the authenticated customer", async () => {
    uploadImageAssetForCustomer.mockResolvedValue({ status: "ready", assetId: "asset-1" });

    const response = await POST(new Request("https://undango.example/api/assets/images", {
      method: "POST",
      headers: { "x-invitation-id": invitationId },
      body: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ assetId: "asset-1" });
    expect(uploadImageAssetForCustomer).toHaveBeenCalledWith(expect.objectContaining({
      customerId: "customer-1",
      invitationId,
      stream: expect.anything(),
    }));
  });
});
