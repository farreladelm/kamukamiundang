import { describe, expect, it } from "vitest";
import {
  defaultWeddingEvents,
  isAllowedMapsUrl,
  isIanaTimeZone,
  isValidEventDate,
  isValidEventTime,
  toEventInstant,
} from "./events";

describe("workspace event utilities", () => {
  it("provides Akad Nikah and Resepsi as default workspace events", () => {
    expect(defaultWeddingEvents.main.label).toBe("Akad Nikah");
    expect(defaultWeddingEvents.main.time).toBe("10:00");
    expect(defaultWeddingEvents.secondary.label).toBe("Resepsi");
    expect(defaultWeddingEvents.secondary.time).toBe("14:00");
    expect(defaultWeddingEvents.main.timeZone).toBe("Asia/Jakarta");
  });

  it("accepts IANA timezones and Maps URLs from approved hosts", () => {
    expect(isIanaTimeZone("Asia/Jakarta")).toBe(true);
    expect(isIanaTimeZone("WIB")).toBe(false);
    expect(isAllowedMapsUrl("https://maps.google.com/?q=Jakarta")).toBe(true);
    expect(isAllowedMapsUrl("https://maps.app.goo.gl/example")).toBe(true);
    expect(isAllowedMapsUrl("https://example.com/maps")).toBe(false);
  });

  it("converts a local IANA event time to a countdown instant", () => {
    expect(toEventInstant("2026-11-14", "08:00", "Asia/Jakarta")?.toISOString()).toBe(
      "2026-11-14T01:00:00.000Z",
    );
  });

  it("rejects impossible dates and out-of-range times", () => {
    expect(isValidEventDate("2026-02-30")).toBe(false);
    expect(isValidEventDate("2026-02-28")).toBe(true);
    expect(isValidEventTime("99:99")).toBe(false);
    expect(isValidEventTime("23:59")).toBe(true);
    expect(toEventInstant("2026-02-30", "10:00", "Asia/Jakarta")).toBeNull();
  });
});
