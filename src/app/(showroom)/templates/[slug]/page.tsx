import { notFound } from "next/navigation";
import { TemplateDetail } from "@/features/showroom/template-detail";
import { getVisibleTemplateCatalog } from "@/features/templates/registry";

export default async function TemplateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string | string[] }>;
}) {
  const { slug } = await params;
  const { to } = await searchParams;
  const template = getVisibleTemplateCatalog().find(
    (candidate) => candidate.slug === slug,
  );

  if (!template) {
    notFound();
  }

  const recipientName = (Array.isArray(to) ? to[0] : to)?.trim().slice(0, 100) || "Nama Tamu";

  return (
    <TemplateDetail
      templateKey={template.templateKey}
      templateVersion={template.templateVersion}
      recipientName={recipientName}
    />
  );
}
