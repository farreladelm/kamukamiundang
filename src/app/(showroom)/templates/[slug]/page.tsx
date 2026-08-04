import { notFound, permanentRedirect } from "next/navigation";
import { TemplateDetail } from "@/features/showroom/template-detail";
import { resolveTemplateCatalogBySlug } from "@/features/templates/catalog";

export default async function TemplateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string | string[] }>;
}) {
  const { slug } = await params;
  const { to } = await searchParams;
  const recipientName = (Array.isArray(to) ? to[0] : to)?.trim().slice(0, 100) || "Nama Tamu";
  const template = await resolveTemplateCatalogBySlug(slug);

  if ("ok" in template) {
    notFound();
  }

  if (template.slug !== slug) {
    const query = recipientName === "Nama Tamu"
      ? ""
      : `?to=${encodeURIComponent(recipientName)}`;
    permanentRedirect(`/templates/${template.slug}${query}`);
  }

  return (
    <TemplateDetail
      template={template}
      recipientName={recipientName}
    />
  );
}
