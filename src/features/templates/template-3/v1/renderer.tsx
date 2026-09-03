import { InvitationExperience } from "@/features/templates/shared/invitation-experience";
import type { TemplateRendererProps } from "@/features/templates/types";

export function TemplateThreeRenderer({ content, palette, publicInvitationSlug }: TemplateRendererProps) {
  return (
    <InvitationExperience
      content={content}
      palette={palette}
      publicInvitationSlug={publicInvitationSlug}
      templateName="Taman Aksara"
      variant="garden"
      mapLinkLabel="Petunjuk arah"
    />
  );
}
