import type { ReactElement } from "react";
import type {
  TemplateContentViewModel,
  TemplateRuntimeManifest,
} from "@/features/templates/types";

export function renderTemplate(
  template: TemplateRuntimeManifest,
  paletteKey: string,
  content: TemplateContentViewModel,
): ReactElement {
  const palette = template.palettes.find((candidate) => candidate.key === paletteKey);

  if (!palette) {
    throw new Error(`Unknown palette "${paletteKey}" for ${template.templateKey} v${template.templateVersion}`);
  }

  const Renderer = template.renderer;

  return <Renderer content={content} palette={palette} />;
}
