import { config } from "./config";

export interface SwipeWindowPeriod {
  windowStart: Date;
  windowEnd: Date;
  secondsUntilReset: number;
  timezone: string;
}

/**
 * Calculates the current fixed 12-hour swipe window aligned to the configured APP_TIMEZONE.
 *
 * Windows in local time:
 * - Block 1: 00:00:00.000 to 11:59:59.999
 * - Block 2: 12:00:00.000 to 23:59:59.999
 *
 * @param date Reference time (defaults to Date.now())
 * @param timezone IANA timezone string (defaults to config.app.timezone, e.g. "Asia/Kolkata")
 */
export function getCurrentSwipeWindow(
  date: Date = new Date(),
  timezone: string = config.app.timezone
): SwipeWindowPeriod {
  // Extract local year, month, day, and hour in the specified timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      partMap[part.type] = parseInt(part.value, 10);
    }
  }

  const localYear = partMap.year;
  const localMonth = partMap.month - 1; // 0-indexed
  const localDay = partMap.day;
  const localHour = partMap.hour;

  // Determine window block: 0 (00:00 - 11:59) or 12 (12:00 - 23:59)
  const windowStartHour = localHour < 12 ? 0 : 12;
  const nextWindowStartHour = windowStartHour === 0 ? 12 : 24;

  // Helper to convert target local date-time parts in specified timezone to a UTC Date
  // We can compute the timezone offset at that instant
  const startLocalString = `${localYear}-${String(localMonth + 1).padStart(2, "0")}-${String(
    localDay
  ).padStart(2, "0")}T${String(windowStartHour).padStart(2, "0")}:00:00`;

  const windowStart = getUtcDateFromLocalString(startLocalString, timezone);

  // Window end is exactly 12 hours (12 * 60 * 60 * 1000 ms) after window start
  const windowEnd = new Date(windowStart.getTime() + 12 * 60 * 60 * 1000);

  const secondsUntilReset = Math.max(
    0,
    Math.floor((windowEnd.getTime() - date.getTime()) / 1000)
  );

  return {
    windowStart,
    windowEnd,
    secondsUntilReset,
    timezone,
  };
}

/**
 * Resolves a local ISO string (e.g. "2026-10-05T00:00:00") in a given IANA timezone to its exact UTC Date.
 */
function getUtcDateFromLocalString(localIsoString: string, timezone: string): Date {
  // Construct an initial naive Date object
  const naiveDate = new Date(localIsoString + "Z");

  // Determine the timezone offset for this point in time
  const tzFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  });

  const tzParts = tzFormatter.formatToParts(naiveDate);
  const tzMap: Record<string, number> = {};
  for (const p of tzParts) {
    if (p.type !== "literal") tzMap[p.type] = parseInt(p.value, 10);
  }

  const tzAsUtcMs = Date.UTC(
    tzMap.year,
    tzMap.month - 1,
    tzMap.day,
    tzMap.hour,
    tzMap.minute,
    tzMap.second
  );

  const diffMs = tzAsUtcMs - naiveDate.getTime();
  // Adjust the naive date by the offset difference
  return new Date(naiveDate.getTime() - diffMs);
}
