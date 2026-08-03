import { notFound } from "next/navigation";
import { TemplateDetail } from "@/features/showroom/template-detail";
import { getVisibleTemplateCatalog } from "@/features/templates/registry";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = getVisibleTemplateCatalog().find(
    (candidate) => candidate.slug === slug,
  );

  if (!template) {
    notFound();
  }

  return (
    <TemplateDetail
      templateKey={template.templateKey}
      templateVersion={template.templateVersion}
    />
  );
}
