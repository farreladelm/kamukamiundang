import { describe, expect, it } from "vitest";
import {
  assertUniqueRuntimeIdentities,
  getTemplateRuntimeManifest,
  templateRegistry,
} from "@/features/templates/registry";

describe("templateRegistry", () => {
  it("keeps six launch concepts versioned with stable palettes and renderers", () => {
    expect(templateRegistry).toHaveLength(6);

    for (const template of templateRegistry) {
      expect(template.templateKey).toMatch(/^template-[1-6]$/);
      expect(template.templateVersion).toBe(1);
      expect(template.contentSchemaVersion).toBe(2);
      expect(template.palettes).toHaveLength(3);
      expect(new Set(template.palettes.map((palette) => palette.key)).size).toBe(
        template.palettes.length,
      );
      expect(template.renderer).toBeTypeOf("function");
      expect(template).not.toHaveProperty("name");
      expect(template).not.toHaveProperty("priceInRupiah");
      expect(template).not.toHaveProperty("slug");
    }
  });

  it("resolves only an exact pinned template version", () => {
    expect(getTemplateRuntimeManifest("template-1", 1)?.previewStyle).toBe("arch");
    expect(getTemplateRuntimeManifest("template-1", 2)).toBeUndefined();
  });

  it("rejects duplicate runtime identities", () => {
    expect(() =>
      assertUniqueRuntimeIdentities([templateRegistry[0], templateRegistry[0]]),
    ).toThrow("Duplicate runtime identity template-1:1");
  });

  it("rejects a demo palette that is not in runtime palette contract", () => {
    expect(() =>
      assertUniqueRuntimeIdentities([{
        ...templateRegistry[0],
        demo: { ...templateRegistry[0].demo, paletteKey: "missing" },
      }]),
    ).toThrow("Unknown demo palette template-1:1:missing");
  });
});
