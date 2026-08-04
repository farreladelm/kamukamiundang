import { describe, expect, it } from "vitest";
import { assertTemplateVersionExists } from "./visibility";

describe("template visibility", () => {
  it("accepts only source-controlled template versions", () => {
    expect(() => assertTemplateVersionExists("template-1", 1)).not.toThrow();
    expect(() => assertTemplateVersionExists("template-1", 999)).toThrow(
      "Unknown template version",
    );
  });
});
