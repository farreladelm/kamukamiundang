import { InvitationExperience } from "@/features/templates/shared/invitation-experience";
import type { TemplateRendererProps } from "@/features/templates/types";

export function TemplateOneRenderer({ content, palette, initiallyOpen }: TemplateRendererProps) {
  return (
    <InvitationExperience
      content={content}
      palette={palette}
      templateName="Larasati"
      variant="classic"
      mapLinkLabel="Buka Google Maps"
      initiallyOpen={initiallyOpen}
    />
  );
}
