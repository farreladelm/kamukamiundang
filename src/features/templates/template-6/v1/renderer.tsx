import { InvitationExperience } from "@/features/templates/shared/invitation-experience";
import type { TemplateRendererProps } from "@/features/templates/types";

export function TemplateSixRenderer({ content, palette, publicInvitationSlug }: TemplateRendererProps) {
  return (
    <InvitationExperience
      content={content}
      palette={palette}
      publicInvitationSlug={publicInvitationSlug}
      templateName="Alinea Baru"
      variant="line"
      mapLinkLabel="Buka peta"
    />
  );
}
