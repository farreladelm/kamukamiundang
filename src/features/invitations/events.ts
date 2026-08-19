export const indonesianTimeZones = [
  { value: "Asia/Jakarta", label: "WIB (Asia/Jakarta)" },
  { value: "Asia/Makassar", label: "WITA (Asia/Makassar)" },
  { value: "Asia/Jayapura", label: "WIT (Asia/Jayapura)" },
] as const;

export const defaultWeddingEvents = {
  main: {
    label: "Akad Nikah",
    date: "",
    time: "10:00",
    timeZone: "Asia/Jakarta",
    venue: "",
    address: "",
    mapUrl: "",
  },
  secondary: {
    label: "Resepsi",
    date: "",
    time: "14:00",
    timeZone: "Asia/Jakarta",
    venue: "",
    address: "",
    mapUrl: "",
  },
} as const;

export function isIanaTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function isAllowedMapsUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (url.hostname === "maps.google.com" || url.hostname === "maps.app.goo.gl") return true;
    if (url.hostname === "www.google.com") return url.pathname === "/maps" || url.pathname.startsWith("/maps/");
    return url.hostname === "goo.gl" && (url.pathname === "/maps" || url.pathname.startsWith("/maps/"));
  } catch {
    return false;
  }
}

export function isValidEventDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isValidEventTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  return Number(match[1]) <= 23 && Number(match[2]) <= 59;
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second,
  ) - date.getTime();
}

export function toEventInstant(date: string, time: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !timeMatch || !isValidEventDate(date) || !isValidEventTime(time) || !isIanaTimeZone(timeZone)) return null;

  const target = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
  );
  let instant = target - getTimeZoneOffset(new Date(target), timeZone);
  instant = target - getTimeZoneOffset(new Date(instant), timeZone);
  return new Date(instant);
}
