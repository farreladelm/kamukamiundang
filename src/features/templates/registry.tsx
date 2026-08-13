import { templateOneV1 } from "@/features/templates/template-1/v1/definition";
import { templateTwoV1 } from "@/features/templates/template-2/v1/definition";
import { templateThreeV1 } from "@/features/templates/template-3/v1/definition";
import { templateFourV1 } from "@/features/templates/template-4/v1/definition";
import { templateFiveV1 } from "@/features/templates/template-5/v1/definition";
import { templateSixV1 } from "@/features/templates/template-6/v1/definition";
import { templateSevenV1 } from "@/features/templates/template-7/v1/definition";
import type { TemplateRuntimeManifest } from "@/features/templates/types";

export const templateRegistry = [
  templateOneV1,
  templateTwoV1,
  templateThreeV1,
  templateFourV1,
  templateFiveV1,
  templateSixV1,
  templateSevenV1,
] as const;

function runtimeIdentity(template: Pick<TemplateRuntimeManifest, "templateKey" | "templateVersion">): string {
  return `${template.templateKey}:${template.templateVersion}`;
}

export function assertUniqueRuntimeIdentities(
  registry: readonly TemplateRuntimeManifest[] = templateRegistry,
): void {
  const identities = new Set<string>();

  for (const template of registry) {
    const identity = runtimeIdentity(template);
    if (identities.has(identity)) {
      throw new Error(`Duplicate runtime identity ${identity}`);
    }
    if (!template.palettes.some((palette) => palette.key === template.demo.paletteKey)) {
      throw new Error(`Unknown demo palette ${identity}:${template.demo.paletteKey}`);
    }
    identities.add(identity);
  }
}

assertUniqueRuntimeIdentities();

export function getTemplateRuntimeManifest(
  templateKey: string,
  templateVersion: number,
): TemplateRuntimeManifest | undefined {
  return templateRegistry.find(
    (template) =>
      template.templateKey === templateKey &&
      template.templateVersion === templateVersion,
  );
}
