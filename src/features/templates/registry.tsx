import { templateOneV1 } from "@/features/templates/template-1/v1/definition";
import { templateTwoV1 } from "@/features/templates/template-2/v1/definition";
import { templateThreeV1 } from "@/features/templates/template-3/v1/definition";
import type {
  TemplateCatalogItem,
  TemplateDefinition,
} from "@/features/templates/types";

export const templateRegistry = [templateOneV1, templateTwoV1, templateThreeV1] as const;

export function getTemplateDefinition(
  templateKey: string,
  templateVersion: number,
): TemplateDefinition | undefined {
  return templateRegistry.find(
    (template) =>
      template.templateKey === templateKey &&
      template.templateVersion === templateVersion,
  );
}

export function getVisibleTemplateCatalog(): TemplateCatalogItem[] {
  return templateRegistry
    .filter((template) => template.isVisible)
    .map((template) => ({
      templateKey: template.templateKey,
      templateVersion: template.templateVersion,
      slug: template.slug,
      name: template.name,
      category: template.category,
      description: template.description,
      priceInRupiah: template.priceInRupiah,
      previewStyle: template.previewStyle,
      isVisible: template.isVisible,
      palettes: template.palettes,
    }));
}
