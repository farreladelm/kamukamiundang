import { describe, expect, it } from "vitest";
import { setTemplateVisibilityAction } from "./actions";
import { initialFormActionState } from "@/features/forms/action-state";

describe("template visibility action", () => {
  it("returns field errors for malformed visibility input", async () => {
    const formData = new FormData();
    formData.set("templateKey", "");
    formData.set("templateVersion", "not-a-number");
    formData.set("isVisible", "maybe");

    const result = await setTemplateVisibilityAction(initialFormActionState, formData);

    expect(result.status).toBe("error");
    expect(result.fieldErrors.templateKey).toBeDefined();
    expect(result.fieldErrors.templateVersion).toBeDefined();
    expect(result.fieldErrors.isVisible).toBeDefined();
  });
});
