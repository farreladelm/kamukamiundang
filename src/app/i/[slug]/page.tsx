import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicInvitationBySlug } from "@/features/invitations/public-data";
import { renderTemplate } from "@/features/templates/render-template";

type InvitationPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getPublicInvitationBySlug(slug);
  if (!invitation) return { title: "Invitation tidak tersedia", robots: { index: false } };

  const names = `${invitation.content.couple.firstName} & ${invitation.content.couple.secondName}`;
  return {
    title: `${names} | Undangan pernikahan`,
    description: `Undangan pernikahan ${names}.`,
    alternates: { canonical: `/i/${invitation.slug}` },
  };
}

export default async function PublicInvitationPage({ params }: InvitationPageProps) {
  const { slug } = await params;
  const invitation = await getPublicInvitationBySlug(slug);
  if (!invitation) notFound();

  return renderTemplate(
    invitation.runtime,
    invitation.paletteKey,
    invitation.content,
    true,
  );
}
