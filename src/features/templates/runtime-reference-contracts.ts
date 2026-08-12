import { templateRegistry } from "./registry";

export type TemplateRuntimeReference = {
  source: "order" | "invitation" | "publishedSnapshot";
  id: string;
  templateKey: string;
  templateVersion: number;
  contentSchemaVersion: number;
  paletteKey: string;
};

export type RuntimeReferenceContract = {
  templateKey: string;
  templateVersion: number;
  contentSchemaVersion: number;
  paletteKeys: readonly string[];
};

function runtimeIdentity(templateKey: string, templateVersion: number): string {
  return `${templateKey}:${templateVersion}`;
}

export function findTemplateRuntimeReferenceDrift(
  references: readonly TemplateRuntimeReference[],
  runtimes: readonly RuntimeReferenceContract[],
): string[] {
  const runtimeMap = new Map(
    runtimes.map((runtime) => [runtimeIdentity(runtime.templateKey, runtime.templateVersion), runtime]),
  );
  const drift: string[] = [];

  for (const reference of references) {
    const identity = runtimeIdentity(reference.templateKey, reference.templateVersion);
    const runtime = runtimeMap.get(identity);
    if (!runtime) {
      drift.push(`missing:${reference.source}:${reference.id}:${identity}`);
      continue;
    }

    if (
      runtime.contentSchemaVersion !== reference.contentSchemaVersion ||
      !runtime.paletteKeys.includes(reference.paletteKey)
    ) {
      const mismatch = runtime.contentSchemaVersion !== reference.contentSchemaVersion
        ? "schema"
        : "palette";
      drift.push(`incompatible:${reference.source}:${reference.id}:${identity}:${mismatch}`);
    }
  }

  return drift;
}

export function getRuntimeReferenceContracts(): RuntimeReferenceContract[] {
  return templateRegistry.map((runtime) => ({
    templateKey: runtime.templateKey,
    templateVersion: runtime.templateVersion,
    contentSchemaVersion: runtime.contentSchemaVersion,
    paletteKeys: runtime.palettes.map((palette) => palette.key),
  }));
}
