/**
 * Cron Expression Parser
 *
 * Parses cron expressions and calculates next run times.
 * Supports standard 5-field cron format: minute hour day month weekday
 */

export interface CronField {
  values: number[];
  isWildcard: boolean;
}

export interface ParsedCron {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

const FIELD_RANGES: Record<string, { min: number; max: number }> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dayOfWeek: { min: 0, max: 6 },
};

const MONTH_NAMES: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const DAY_NAMES: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

/**
 * Parse a single cron field
 */
function parseField(field: string, fieldName: string): CronField {
  const range = FIELD_RANGES[fieldName];
  const values: number[] = [];
  let isWildcard = false;

  // Replace month and day names
  let normalizedField = field.toLowerCase();
  if (fieldName === "month") {
    for (const [name, num] of Object.entries(MONTH_NAMES)) {
      normalizedField = normalizedField.replace(new RegExp(name, "gi"), String(num));
    }
  }
  if (fieldName === "dayOfWeek") {
    for (const [name, num] of Object.entries(DAY_NAMES)) {
      normalizedField = normalizedField.replace(new RegExp(name, "gi"), String(num));
    }
  }

  // Handle wildcard
  if (normalizedField === "*") {
    isWildcard = true;
    for (let i = range.min; i <= range.max; i++) {
      values.push(i);
    }
    return { values, isWildcard };
  }

  // Handle step values (*/5, 0-30/5)
  if (normalizedField.includes("/")) {
    const [rangeStr, stepStr] = normalizedField.split("/");
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step < 1) {
      throw new Error(`Invalid step value in ${fieldName}: ${stepStr}`);
    }

    let start = range.min;
    let end = range.max;

    if (rangeStr !== "*") {
      if (rangeStr.includes("-")) {
        const [s, e] = rangeStr.split("-").map((v) => parseInt(v, 10));
        start = s;
        end = e;
      } else {
        start = parseInt(rangeStr, 10);
      }
    }

    for (let i = start; i <= end; i += step) {
      if (i >= range.min && i <= range.max) {
        values.push(i);
      }
    }
    return { values, isWildcard: false };
  }

  // Handle comma-separated values
  const parts = normalizedField.split(",");
  for (const part of parts) {
    // Handle ranges (1-5)
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range in ${fieldName}: ${part}`);
      }

      if (start > end) {
        throw new Error(`Invalid range in ${fieldName}: start > end`);
      }

      for (let i = start; i <= end; i++) {
        if (i >= range.min && i <= range.max && !values.includes(i)) {
          values.push(i);
        }
      }
    } else {
      // Single value
      const value = parseInt(part, 10);
      if (isNaN(value)) {
        throw new Error(`Invalid value in ${fieldName}: ${part}`);
      }
      if (value >= range.min && value <= range.max && !values.includes(value)) {
        values.push(value);
      }
    }
  }

  values.sort((a, b) => a - b);
  return { values, isWildcard: false };
}

/**
 * Parse a cron expression
 */
export function parseCronExpression(expression: string): ParsedCron {
  const parts = expression.trim().split(/\s+/);

  if (parts.length !== 5) {
    throw new Error(
      `Invalid cron expression: expected 5 fields (minute hour day month weekday), got ${parts.length}`
    );
  }

  return {
    minute: parseField(parts[0], "minute"),
    hour: parseField(parts[1], "hour"),
    dayOfMonth: parseField(parts[2], "dayOfMonth"),
    month: parseField(parts[3], "month"),
    dayOfWeek: parseField(parts[4], "dayOfWeek"),
  };
}

/**
 * Find the next valid value in a field
 */
function findNextValue(values: number[], current: number, wrap: boolean = true): {
  value: number;
  wrapped: boolean;
} {
  for (const v of values) {
    if (v >= current) {
      return { value: v, wrapped: false };
    }
  }

  if (wrap && values.length > 0) {
    return { value: values[0], wrapped: true };
  }

  throw new Error("No valid value found");
}

/**
 * Calculate the next run time for a parsed cron expression
 */
export function getNextRunTime(cron: ParsedCron, after: Date = new Date()): Date {
  const next = new Date(after);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // Start from the next minute
  next.setMinutes(next.getMinutes() + 1);

  // Maximum iterations to prevent infinite loops
  const maxIterations = 366 * 24 * 60; // One year of minutes
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // Check month
    const currentMonth = next.getMonth() + 1;
    if (!cron.month.values.includes(currentMonth)) {
      const { value, wrapped } = findNextValue(cron.month.values, currentMonth);
      if (wrapped) {
        next.setFullYear(next.getFullYear() + 1);
      }
      next.setMonth(value - 1);
      next.setDate(1);
      next.setHours(0);
      next.setMinutes(0);
      continue;
    }

    // Check day of month and day of week
    const currentDayOfMonth = next.getDate();
    const currentDayOfWeek = next.getDay();

    const dayOfMonthValid = cron.dayOfMonth.isWildcard || cron.dayOfMonth.values.includes(currentDayOfMonth);
    const dayOfWeekValid = cron.dayOfWeek.isWildcard || cron.dayOfWeek.values.includes(currentDayOfWeek);

    // If both are wildcards, any day is valid
    // If one is specified, that one must match
    // If both are specified, either can match (OR logic, per cron standard)
    const bothWildcard = cron.dayOfMonth.isWildcard && cron.dayOfWeek.isWildcard;
    const eitherSpecified = !cron.dayOfMonth.isWildcard || !cron.dayOfWeek.isWildcard;
    const dayValid = bothWildcard || (eitherSpecified && (dayOfMonthValid || dayOfWeekValid));

    if (!dayValid) {
      next.setDate(next.getDate() + 1);
      next.setHours(0);
      next.setMinutes(0);
      continue;
    }

    // Check hour
    const currentHour = next.getHours();
    if (!cron.hour.values.includes(currentHour)) {
      const { value, wrapped } = findNextValue(cron.hour.values, currentHour);
      if (wrapped) {
        next.setDate(next.getDate() + 1);
      }
      next.setHours(value);
      next.setMinutes(0);
      continue;
    }

    // Check minute
    const currentMinute = next.getMinutes();
    if (!cron.minute.values.includes(currentMinute)) {
      const { value, wrapped } = findNextValue(cron.minute.values, currentMinute);
      if (wrapped) {
        next.setHours(next.getHours() + 1);
        continue;
      }
      next.setMinutes(value);
      continue;
    }

    // All fields match
    return next;
  }

  throw new Error("Could not find next run time within one year");
}

/**
 * Calculate the next run time from a cron expression string
 */
export function calculateNextRun(expression: string, after: Date = new Date()): Date {
  const parsed = parseCronExpression(expression);
  return getNextRunTime(parsed, after);
}

/**
 * Get multiple upcoming run times
 */
export function getUpcomingRuns(expression: string, count: number = 5, after: Date = new Date()): Date[] {
  const runs: Date[] = [];
  let current = new Date(after);

  for (let i = 0; i < count; i++) {
    const next = calculateNextRun(expression, current);
    runs.push(next);
    current = next;
  }

  return runs;
}

/**
 * Check if a cron expression would match the given date
 */
export function matchesCron(expression: string, date: Date): boolean {
  try {
    const cron = parseCronExpression(expression);

    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = date.getDay();

    if (!cron.minute.values.includes(minute)) return false;
    if (!cron.hour.values.includes(hour)) return false;
    if (!cron.month.values.includes(month)) return false;

    const dayOfMonthValid = cron.dayOfMonth.isWildcard || cron.dayOfMonth.values.includes(dayOfMonth);
    const dayOfWeekValid = cron.dayOfWeek.isWildcard || cron.dayOfWeek.values.includes(dayOfWeek);
    const bothWildcard = cron.dayOfMonth.isWildcard && cron.dayOfWeek.isWildcard;

    if (bothWildcard) return true;
    return dayOfMonthValid || dayOfWeekValid;
  } catch {
    return false;
  }
}

/**
 * Common cron presets
 */
export const CRON_PRESETS = {
  everyMinute: "* * * * *",
  every5Minutes: "*/5 * * * *",
  every15Minutes: "*/15 * * * *",
  every30Minutes: "*/30 * * * *",
  everyHour: "0 * * * *",
  every2Hours: "0 */2 * * *",
  every6Hours: "0 */6 * * *",
  every12Hours: "0 */12 * * *",
  everyDayAtMidnight: "0 0 * * *",
  everyDayAtNoon: "0 12 * * *",
  everyWeekdayAtMidnight: "0 0 * * 1-5",
  everySundayAtMidnight: "0 0 * * 0",
  firstDayOfMonth: "0 0 1 * *",
} as const;
