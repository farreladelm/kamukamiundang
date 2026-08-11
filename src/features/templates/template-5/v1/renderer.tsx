import { InvitationExperience } from "@/features/templates/shared/invitation-experience";
import type { TemplateRendererProps } from "@/features/templates/types";

export function TemplateFiveRenderer({ content, palette }: TemplateRendererProps) {
  return (
    <InvitationExperience
      content={content}
      palette={palette}
      templateName="Ratri Kirana"
      variant="noir"
      mapLinkLabel="Lihat lokasi"
    />
  );
}
