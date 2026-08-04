import { describe, expect, it } from "vitest";
import { canTransitionOrder, assertOrderTransition } from "./policies";

describe("order lifecycle policy", () => {
  it.each([
    ["PENDING", "PAID"],
    ["PENDING", "CANCELLED"],
    ["PAID", "ACTIVATED"],
    ["PAID", "REFUNDED"],
    ["ACTIVATED", "REFUNDED"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(canTransitionOrder(from, to)).toBe(true);
    expect(() => assertOrderTransition(from, to)).not.toThrow();
  });

  it("rejects skipped or backwards transitions", () => {
    expect(canTransitionOrder("PENDING", "ACTIVATED")).toBe(false);
    expect(() => assertOrderTransition("PAID", "PENDING")).toThrow(
      "Invalid order status transition",
    );
  });
});
