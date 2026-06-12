// Shared booking helpers — pure (no server imports), used by the booking modal
// AND the API route so the available slots stay in sync.

// Default bookable times (Eastern). Lunch (12:00) intentionally skipped.
export const SLOT_TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"] as const;

// Master list the dashboard lets you toggle on/off (every 30 min, 8am–6pm ET).
export const ALL_SLOT_TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00",
];

export const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5]; // Mon–Fri (0=Sun)
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface BookingSettings {
  weekdays: number[];
  times: string[];
  blocked: string[];
  horizonDays: number;
}

export const DEFAULT_SETTINGS: BookingSettings = {
  weekdays: DEFAULT_WEEKDAYS,
  times: [...SLOT_TIMES],
  blocked: [],
  horizonDays: 14,
};

const pad = (n: number) => String(n).padStart(2, "0");
export const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The next `count` bookable dates given enabled weekdays + blocked list. */
export function upcomingDays(s: BookingSettings, count?: number): string[] {
  const want = count ?? s.horizonDays ?? 14;
  const out: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  let guard = 0;
  while (out.length < want && guard < 400) {
    guard++;
    d.setDate(d.getDate() + 1);
    const ymd = toYMD(d);
    if (s.weekdays.includes(d.getDay()) && !s.blocked.includes(ymd)) out.push(ymd);
  }
  return out;
}

/** Back-compat: next N weekdays (Mon–Fri). */
export function upcomingWeekdays(count = 10): string[] {
  return upcomingDays(DEFAULT_SETTINGS, count);
}

/** Server-side validity against the active settings: enabled weekday, not
    blocked, not in the past, within the booking horizon. */
export function isSlotBookable(s: BookingSettings, ymd: string, hhmm: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  if (!s.times.includes(hhmm)) return false;
  if (s.blocked.includes(ymd)) return false;
  const d = new Date(ymd + "T12:00:00");
  if (isNaN(d.getTime())) return false;
  if (!s.weekdays.includes(d.getUTCDay())) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const min = new Date(today); min.setDate(min.getDate() - 1);
  const max = new Date(today); max.setDate(max.getDate() + (s.horizonDays || 14) + 5);
  return d >= min && d <= max;
}

/** Lenient date-only check used by the GET availability lookup. */
export function isBookableDate(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = new Date(ymd + "T12:00:00");
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const min = new Date(today); min.setDate(min.getDate() - 1);
  const max = new Date(today); max.setDate(max.getDate() + 120);
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

// ── Calendar export (Google Calendar link + .ics) ──────────────────────────
// GES's email — appears as the meeting guest/organizer so both sides connect.
export const GES_CONTACT_EMAIL = "contact@ges.ca";
export const MEETING_MINUTES = 30;
const TZ = "America/New_York"; // slots are Eastern

/** Convert an ET wall-clock slot (date + "HH:MM") to the absolute UTC instant,
    accounting for EST/EDT via the Intl timezone database. */
export function etToUtc(ymd: string, hhmm: string): Date {
  const [Y, M, D] = ymd.split("-").map(Number);
  const [h, m] = hhmm.split(":").map(Number);
  const guess = Date.UTC(Y, M - 1, D, h, m, 0);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(new Date(guess))) p[part.type] = part.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +(p.hour === "24" ? "0" : p.hour), +p.minute, +p.second);
  const offset = asUTC - guess; // TZ offset from UTC at that instant
  return new Date(guess - offset);
}

/** Compact UTC stamp for calendar URLs / ICS: YYYYMMDDTHHMMSSZ */
function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function range(ymd: string, hhmm: string) {
  const start = etToUtc(ymd, hhmm);
  const end = new Date(start.getTime() + MEETING_MINUTES * 60000);
  return { start, end };
}

/** Pre-filled "Add to Google Calendar" URL (GES added as a guest). */
export function googleCalUrl(ymd: string, hhmm: string, notes?: string): string {
  const { start, end } = range(ymd, hhmm);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "GES — Discovery Call",
    dates: `${stamp(start)}/${stamp(end)}`,
    details: `Your 30-min discovery call with GES (Global E-Commerce Saviours).${notes ? `\n\nWhat you want built: ${notes}` : ""}\n\nQuestions? ${GES_CONTACT_EMAIL}`,
    add: GES_CONTACT_EMAIL,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** A downloadable .ics (Apple Calendar / Outlook / any client) with a reminder. */
export function buildIcs(name: string, email: string, ymd: string, hhmm: string, notes?: string): string {
  const { start, end } = range(ymd, hhmm);
  const esc = (s: string) => (s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const uid = `${stamp(start)}-${Math.random().toString(36).slice(2)}@ges`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//GES//Booking//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    "SUMMARY:GES — Discovery Call",
    `DESCRIPTION:${esc(`Your 30-min discovery call with GES.${notes ? `\nWhat you want built: ${notes}` : ""}`)}`,
    `ORGANIZER;CN=GES:mailto:${GES_CONTACT_EMAIL}`,
    `ATTENDEE;CN=${esc(name)};RSVP=TRUE:mailto:${email}`,
    `ATTENDEE;CN=GES:mailto:${GES_CONTACT_EMAIL}`,
    "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:GES Discovery Call in 30 min", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
