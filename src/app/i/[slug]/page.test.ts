import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicInvitationBySlugMock, headersMock } = vi.hoisted(() => ({
  getPublicInvitationBySlugMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("@/features/invitations/public-data", () => ({
  getPublicInvitationBySlug: getPublicInvitationBySlugMock,
}));
vi.mock("@/features/templates/render-template", () => ({ renderTemplate: vi.fn() }));

import { dynamic } from "./opengraph-image";
import { generateMetadata } from "./page";

describe("public invitation metadata", () => {
  beforeEach(() => {
    getPublicInvitationBySlugMock.mockResolvedValue({
      content: { couple: { firstName: "Rani", secondName: "Dimas" } },
      slug: "rani-dimas",
    });
    headersMock.mockResolvedValue(
      new Headers({ "x-forwarded-host": "preview.undango.test", "x-forwarded-proto": "https" }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("uses configured production origin instead of request host", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://kamukamiundang.example/subpath");

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "rani-dimas" }) });

    expect(metadata.metadataBase).toEqual(new URL("https://kamukamiundang.example"));
  });

  it("uses local request origin for development metadata", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("APP_URL", "");

    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "rani-dimas" }) });

    expect(metadata.metadataBase).toEqual(new URL("https://preview.undango.test"));
  });

  it("renders the Open Graph image at request time", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});
