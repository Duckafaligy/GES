import { buildIcs, fmtDateFull, fmtTime } from "./booking";

// Server-only. Emails GES a notification on each booking via Resend (one HTTPS
// call, no SDK). Gated on env so it no-ops until configured:
//   RESEND_API_KEY        — from resend.com
//   BOOKING_NOTIFY_EMAIL  — where the alert goes (your email)
//   BOOKING_FROM_EMAIL    — optional "from" (defaults to Resend's shared sender,
//                            which works without verifying a domain)

interface BookingInfo {
  name: string; email: string; business: string | null; notes: string | null;
  slot_date: string; slot_time: string;
}

export function emailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.BOOKING_NOTIFY_EMAIL);
}

export async function sendBookingEmail(b: BookingInfo): Promise<{ ok?: boolean; skipped?: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.BOOKING_NOTIFY_EMAIL;
  if (!key || !to) return { skipped: true };
  const from = process.env.BOOKING_FROM_EMAIL || "GES Bookings <onboarding@resend.dev>";

  const when = `${fmtDateFull(b.slot_date)} · ${fmtTime(b.slot_time)} ET`;
  const ics = buildIcs(b.name, b.email, b.slot_date, b.slot_time, b.notes ?? undefined);
  const row = (label: string, val: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#888;font:600 12px/1.5 monospace;text-transform:uppercase;letter-spacing:.08em">${label}</td><td style="padding:4px 0;color:#111;font:14px/1.5 system-ui">${val}</td></tr>`;

  const html = `
  <div style="max-width:520px;margin:0 auto;font-family:system-ui,sans-serif;border:2px solid #0a0a0a">
    <div style="background:#0a0a0a;color:#ccff00;padding:16px 20px;font:800 14px/1 system-ui;text-transform:uppercase;letter-spacing:-.01em">New Discovery Call Booked</div>
    <div style="padding:20px">
      <div style="font:800 20px/1.2 system-ui;color:#111;margin-bottom:14px">${when}</div>
      <table style="border-collapse:collapse">
        ${row("Name", b.name)}
        ${row("Email", `<a href="mailto:${b.email}" style="color:#0a0a0a">${b.email}</a>`)}
        ${b.business ? row("Business", b.business) : ""}
        ${b.notes ? row("Wants built", b.notes) : ""}
      </table>
      <p style="color:#888;font:12px/1.6 system-ui;margin-top:16px">The .ics attachment adds this to your calendar. Reply to reach the prospect.</p>
    </div>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: b.email,
      subject: `New booking — ${b.name} · ${when}`,
      html,
      attachments: [{ filename: "ges-discovery-call.ics", content: Buffer.from(ics).toString("base64") }],
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return { ok: true };
}
