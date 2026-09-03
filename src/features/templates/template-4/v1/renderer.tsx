import { InvitationExperience } from "@/features/templates/shared/invitation-experience";
import type { TemplateRendererProps } from "@/features/templates/types";

export function TemplateFourRenderer({ content, palette, publicInvitationSlug }: TemplateRendererProps) {
  return (
    <InvitationExperience
      content={content}
      palette={palette}
      publicInvitationSlug={publicInvitationSlug}
      templateName="Cahaya Hati"
      variant="crescent"
      mapLinkLabel="Buka Google Maps"
    />
  );
}
