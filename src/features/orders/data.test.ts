import { describe, expect, it } from "vitest";
import { parseTemplateSelection } from "./data";

describe("order template selection", () => {
  it("parses template key, version, and compatible palette together", () => {
    expect(parseTemplateSelection("template-2|1|terakota")).toEqual({
      templateKey: "template-2",
      templateVersion: 1,
      paletteKey: "terakota",
    });
  });

  it("rejects malformed selections", () => {
    expect(() => parseTemplateSelection("template-2|bad")).toThrow(
      "Invalid template selection",
    );
  });
});
