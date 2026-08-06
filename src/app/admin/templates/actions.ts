"use server";

import { requireAdmin } from "@/features/auth/policies";
import {
  TemplateCatalogMutationError,
  templateCatalogMutationSchema,
  updateTemplateCatalog,
} from "@/features/templates/catalog-mutations";
import { revalidatePath } from "next/cache";
import { formDataToObject } from "@/features/forms/schemas";
import {
  type FormActionState,
  formErrorState,
  initialFormActionState,
  successState,
  zodErrorState,
} from "@/features/forms/action-state";
import { z } from "zod";

export async function updateTemplateCatalogAction(
  _previousState: FormActionState = initialFormActionState,
  formData?: FormData,
): Promise<FormActionState> {
  void _previousState;
  const { admin } = await requireAdmin();
  const parsed = templateCatalogMutationSchema.safeParse(
    formDataToObject(formData ?? new FormData()),
  );
  if (!parsed.success) return zodErrorState(parsed.error);

  let updated: Awaited<ReturnType<typeof updateTemplateCatalog>>;
  try {
    updated = await updateTemplateCatalog({ ...parsed.data, adminId: admin.id });
  } catch (error) {
    if (error instanceof TemplateCatalogMutationError) {
      return formErrorState(error.message, error.fieldErrors);
    }
    if (error instanceof z.ZodError) return zodErrorState(error);
    return formErrorState("Metadata template tidak dapat diperbarui.");
  }

  revalidatePath("/admin/templates");
  revalidatePath("/");
  revalidatePath(`/templates/${updated.previousSlug}`);
  revalidatePath(`/templates/${updated.slug}`);
  revalidatePath("/templates/[slug]", "page");
  return successState("Metadata template berhasil diperbarui.");
}
