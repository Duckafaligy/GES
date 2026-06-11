// Shared booking helpers — pure (no server imports), used by the booking modal
// AND the API route so the available slots stay in sync.

// Bookable times (Eastern). Lunch (12:00) intentionally skipped.
export const SLOT_TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"] as const;

const pad = (n: number) => String(n).padStart(2, "0");
export const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The next `count` weekdays (Mon–Fri), starting tomorrow, as YYYY-MM-DD. */
export function upcomingWeekdays(count = 10): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(toYMD(d));
  }
  return out;
}

/** Lenient server-side validity: a weekday, not in the past, within ~3 months. */
export function isBookableDate(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = new Date(ymd + "T12:00:00");
  if (isNaN(d.getTime())) return false;
  const day = d.getUTCDay();
  if (day === 0 || day === 6) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const max = new Date(today); max.setDate(max.getDate() + 95);
  // allow from yesterday to absorb timezone edge cases
  const min = new Date(today); min.setDate(min.getDate() - 1);
  return d >= min && d <= max;
}

export function fmtDateLong(ymd: string): string {
  const d = new Date(ymd + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function fmtDateFull(ymd: string): string {
  const d = new Date(ymd + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${pad(m)} ${ampm}`;
}
