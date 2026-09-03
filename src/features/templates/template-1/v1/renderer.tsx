import { InvitationExperience } from "@/features/templates/shared/invitation-experience";
import type { TemplateRendererProps } from "@/features/templates/types";

export function TemplateOneRenderer({ content, palette, publicInvitationSlug }: TemplateRendererProps) {
  return (
    <InvitationExperience
      content={content}
      palette={palette}
      publicInvitationSlug={publicInvitationSlug}
      templateName="Larasati"
      variant="classic"
      mapLinkLabel="Buka Google Maps"
    />
  );
}
