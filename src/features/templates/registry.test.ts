import { describe, expect, it } from "vitest";
import {
  getTemplateDefinition,
  templateRegistry,
} from "@/features/templates/registry";

describe("templateRegistry", () => {
  it("keeps three launch concepts versioned with stable palettes and renderers", () => {
    expect(templateRegistry).toHaveLength(3);

    for (const template of templateRegistry) {
      expect(template.templateKey).toMatch(/^template-[1-3]$/);
      expect(template.templateVersion).toBe(1);
      expect(template.contentSchemaVersion).toBe(2);
      expect(template.palettes).toHaveLength(3);
      expect(new Set(template.palettes.map((palette) => palette.key)).size).toBe(
        template.palettes.length,
      );
      expect(template.renderer).toBeTypeOf("function");
    }
  });

  it("resolves only an exact pinned template version", () => {
    expect(getTemplateDefinition("template-1", 1)?.slug).toBe("larasati");
    expect(getTemplateDefinition("template-1", 2)).toBeUndefined();
  });
});
