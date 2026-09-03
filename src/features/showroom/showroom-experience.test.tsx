import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShowroomExperience } from "@/features/showroom/showroom-experience";
import { templateRegistry } from "@/features/templates/registry";
import type { TemplateCatalogItem } from "@/features/templates/types";

const templates: TemplateCatalogItem[] = templateRegistry.map((template, index) => ({
  templateKey: template.templateKey,
  templateVersion: template.templateVersion,
  slug: ["larasati", "pesisir-senja", "taman-aksara", "cahaya-hati", "ratri-kirana", "alinea-baru", "neon-vow"][index],
  name: ["Larasati", "Pesisir Senja", "Taman Aksara", "Cahaya Hati", "Ratri Kirana", "Alinea Baru", "Neon Vow"][index],
  category: ["Klasik", "Modern", "Botanical", "Islami", "Elegant", "Minimalis", "Modern"][index],
  description: "Deskripsi katalog",
  priceInRupiah: 650000,
  marketingThumbnail: null,
  displayOrder: (index + 1) * 10,
  status: "VISIBLE",
  isVisible: true,
  contentSchemaVersion: template.contentSchemaVersion,
  previewStyle: template.previewStyle,
  capabilities: template.capabilities,
  palettes: template.palettes,
  demo: template.demo,
}));

describe("ShowroomExperience", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("reorders and badges the catalog once a match comes back, and shows the fallback notice", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          source: "fallback",
          results: [
            {
              templateKey: "template-3",
              templateVersion: 1,
              slug: "taman-aksara",
              score: 3,
              reasons: ['cocok dengan kategori "botanical"'],
              paletteKey: "mawar",
            },
            { templateKey: "template-1", templateVersion: 1, slug: "larasati", score: 0, reasons: [], paletteKey: "gading" },
            { templateKey: "template-2", templateVersion: 1, slug: "pesisir-senja", score: 0, reasons: [], paletteKey: "terakota" },
          ],
        }),
    });

    render(<ShowroomExperience templates={templates} canonicalOrigin="https://undango.test" />);

    fireEvent.change(screen.getByLabelText("Ceritakan pernikahanmu"), {
      target: { value: "Pesta taman yang penuh bunga" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cocokkan template" }));

    await waitFor(() => expect(screen.getByText("Cocok untukmu")).toBeInTheDocument());
    expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent("Taman Aksara");
    expect(screen.getByRole("status")).toHaveTextContent("mode sederhana");
  });
});
