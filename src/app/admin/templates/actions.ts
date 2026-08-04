"use server";

import { requireAdmin } from "@/features/auth/policies";
import { setTemplateVisibility } from "@/features/templates/visibility";
import { revalidatePath } from "next/cache";
import {
  formDataToObject,
  templateVisibilitySchema,
} from "@/features/forms/schemas";
import {
  type FormActionState,
  formErrorState,
  initialFormActionState,
  successState,
  zodErrorState,
} from "@/features/forms/action-state";

export async function setTemplateVisibilityAction(
  _previousState: FormActionState = initialFormActionState,
  formData?: FormData,
): Promise<FormActionState> {
  void _previousState;
  const parsed = templateVisibilitySchema.safeParse(formDataToObject(formData ?? new FormData()));
  if (!parsed.success) return zodErrorState(parsed.error);

  const { admin } = await requireAdmin();

  try {
    await setTemplateVisibility({
      ...parsed.data,
      templateVersion: parsed.data.templateVersion,
      isVisible: parsed.data.isVisible === "true",
      adminId: admin.id,
    });
  } catch {
    return formErrorState("Template tidak dapat diperbarui.");
  }

  revalidatePath("/admin/templates");
  revalidatePath("/");
  revalidatePath("/templates/[slug]", "page");
  return successState(parsed.data.isVisible === "true" ? "Template ditampilkan." : "Template disembunyikan.");
}
