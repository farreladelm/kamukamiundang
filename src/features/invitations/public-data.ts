import "server-only";

import { db } from "@/lib/server/db";
import { getTemplateRuntimeManifest } from "@/features/templates/registry";
import { toTemplateContentViewModel } from "./content-schema";
import { validateWorkspaceDraft } from "./workspace-dto";

export async function getPublicInvitationBySlug(slug: string) {
  const invitation = await db.invitation.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      slug: true,
      snapshot: {
        select: {
          templateKey: true,
          templateVersion: true,
          contentSchemaVersion: true,
          paletteKey: true,
          content: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!invitation?.snapshot) return null;

  const runtime = getTemplateRuntimeManifest(
    invitation.snapshot.templateKey,
    invitation.snapshot.templateVersion,
  );
  if (
    !runtime
    || runtime.contentSchemaVersion !== invitation.snapshot.contentSchemaVersion
    || !runtime.palettes.some((palette) => palette.key === invitation.snapshot?.paletteKey)
  ) {
    return null;
  }

  try {
    const draft = validateWorkspaceDraft(invitation.snapshot.content);
    return {
      slug: invitation.slug,
      publishedAt: invitation.snapshot.publishedAt,
      runtime,
      paletteKey: invitation.snapshot.paletteKey,
      content: toTemplateContentViewModel(draft, runtime.demo.content, runtime.capabilities),
    };
  } catch {
    return null;
  }
}
