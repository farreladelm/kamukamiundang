import { ImageResponse } from "next/og";
import { getPublicInvitationBySlug } from "@/features/invitations/public-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const invitation = await getPublicInvitationBySlug(slug);
  if (!invitation) return new Response(null, { status: 404 });

  const palette = invitation.runtime.palettes.find((item) => item.key === invitation.paletteKey);
  if (!palette) return new Response(null, { status: 404 });
  const names = `${invitation.content.couple.firstName} & ${invitation.content.couple.secondName}`;

  return new ImageResponse(
    (
      <div style={{ alignItems: "center", background: palette.tokens.canvas, color: palette.tokens.ink, display: "flex", height: "100%", justifyContent: "center", padding: 80, textAlign: "center", width: "100%" }}>
        <div style={{ border: `2px solid ${palette.tokens.line}`, display: "flex", flexDirection: "column", gap: 24, padding: 56, width: "100%" }}>
          <div style={{ color: palette.tokens.accent, display: "flex", fontSize: 24, letterSpacing: 6, textTransform: "uppercase" }}>Undangan pernikahan</div>
          <div style={{ display: "flex", fontFamily: "serif", fontSize: 76, justifyContent: "center", lineHeight: 1.05 }}>{names}</div>
          <div style={{ color: palette.tokens.muted, display: "flex", fontSize: 26, justifyContent: "center" }}>{invitation.content.eventDate}</div>
        </div>
      </div>
    ),
    size,
  );
}
