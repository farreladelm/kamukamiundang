// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();

vi.mock("@/lib/server/db", () => ({
  db: { analyticsEvent: { create } },
}));

import { POST } from "./route";

describe("POST /api/analytics/events", () => {
  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue({});
  });

  it("stores only derived allowlisted event fields", async () => {
    const response = await POST(
      new Request("https://undango.example/api/analytics/events", {
        method: "POST",
        body: JSON.stringify({
          name: "whatsapp_cta_clicked",
          properties: {
            templateKey: "template-1",
            templateVersion: 1,
            paletteKey: "gading",
          },
        }),
      }),
    );

    expect(response.status).toBe(204);
    expect(create).toHaveBeenCalledWith({
      data: {
        name: "whatsapp_cta_clicked",
        properties: {
          templateKey: "template-1",
          templateVersion: 1,
          paletteKey: "gading",
          priceInRupiah: 650000,
        },
      },
    });
  });

  it("rejects payloads containing non-allowlisted data", async () => {
    const response = await POST(
      new Request("https://undango.example/api/analytics/events", {
        method: "POST",
        body: JSON.stringify({
          name: "whatsapp_cta_clicked",
          properties: {
            templateKey: "template-1",
            templateVersion: 1,
            paletteKey: "gading",
            email: "visitor@example.com",
          },
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
