import { describe, expect, it } from "vitest";
import { createPendingOrderAction } from "./actions";
import { initialFormActionState } from "@/features/forms/action-state";

describe("order action", () => {
  it("returns field errors before authentication for invalid form data", async () => {
    const formData = new FormData();
    formData.set("customerName", "");
    formData.set("email", "invalid");
    formData.set("templateSelection", "");
    formData.set("photoLimit", "-1");

    const result = await createPendingOrderAction(initialFormActionState, formData);

    expect(result.status).toBe("error");
    expect(result.fieldErrors.customerName).toBeDefined();
    expect(result.fieldErrors.email).toBeDefined();
    expect(result.fieldErrors.templateSelection).toBeDefined();
    expect(result.fieldErrors.photoLimit).toBeDefined();
  });
});
