import { InvitationExperience } from "@/features/templates/shared/invitation-experience";
import type { TemplateRendererProps } from "@/features/templates/types";

export function TemplateTwoRenderer({ content, palette, publicInvitationSlug }: TemplateRendererProps) {
  return (
    <InvitationExperience
      content={content}
      palette={palette}
      publicInvitationSlug={publicInvitationSlug}
      templateName="Pesisir Senja"
      variant="coast"
      mapLinkLabel="Lihat lokasi"
    />
  );
}
