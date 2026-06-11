import { createSign } from "crypto";

// Server-only. Creates a Google Calendar event on GES's calendar when someone
// books, using a service account (no interactive OAuth). Configure via env:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  — the service account's email
//   GOOGLE_PRIVATE_KEY            — its private key (PEM; \n-escaped is fine)
//   GOOGLE_CALENDAR_ID           — the calendar to write to (usually your Gmail)
// If any are missing, this no-ops so bookings still work without it.

const TOKEN_URI = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

function config() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!email || !key || !calendarId) return null;
  key = key.replace(/\\n/g, "\n"); // env vars store newlines escaped
  return { email, key, calendarId };
}

export function gcalConfigured(): boolean {
  return config() !== null;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

async function getAccessToken(email: string, key: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URI, iat: now, exp: now + 3600 }));
  const input = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(input); signer.end();
  const jwt = `${input}.${b64url(signer.sign(key))}`;

  const res = await fetch(TOKEN_URI, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`Google token ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token as string;
}

interface BookingEvent {
  name: string; email: string; business: string | null; notes: string | null;
  startISO: string; endISO: string;
}

/** Best-effort: create the calendar event. Returns {skipped} if unconfigured. */
export async function createBookingEvent(b: BookingEvent): Promise<{ ok?: boolean; skipped?: boolean }> {
  const c = config();
  if (!c) return { skipped: true };

  const token = await getAccessToken(c.email, c.key);
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(c.calendarId)}/events`;
  const event: Record<string, unknown> = {
    summary: `GES Call — ${b.name}`,
    description:
      `Discovery call booked from the GES site.\n\n` +
      `Name: ${b.name}\nEmail: ${b.email}` +
      (b.business ? `\nBusiness: ${b.business}` : "") +
      (b.notes ? `\n\nWants built: ${b.notes}` : ""),
    start: { dateTime: b.startISO },
    end: { dateTime: b.endISO },
    attendees: [{ email: b.email, displayName: b.name }],
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }, { method: "email", minutes: 60 }] },
  };

  // Try with the booker as an attendee + invite. Personal Gmail service accounts
  // can't email external attendees, so fall back to a plain event (still lands on
  // your calendar with reminders, booker info in the description).
  let res = await fetch(`${base}?sendUpdates=all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    delete event.attendees;
    res = await fetch(base, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error(`Google Calendar ${res.status}: ${await res.text()}`);
  }
  return { ok: true };
}
