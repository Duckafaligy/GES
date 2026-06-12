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

function fromAddress(): string {
  return process.env.BOOKING_FROM_EMAIL || "GES <onboarding@resend.dev>";
}

interface Mail {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: string }[];
}

async function sendViaResend(m: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromAddress(),
      to: [m.to],
      ...(m.replyTo ? { reply_to: m.replyTo } : {}),
      subject: m.subject,
      html: m.html,
      ...(m.attachments ? { attachments: m.attachments } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

/** Brutalist-brand shell for all GES emails. */
function shell(title: string, inner: string): string {
  return `
  <div style="max-width:520px;margin:0 auto;font-family:system-ui,sans-serif;border:2px solid #0a0a0a">
    <div style="background:#0a0a0a;padding:16px 20px">
      <span style="display:inline-block;background:#ccff00;color:#0a0a0a;font:900 14px/1 system-ui;padding:6px 9px;border:2px solid #fff">G</span>
      <span style="color:#ccff00;font:800 14px/1 system-ui;text-transform:uppercase;letter-spacing:.02em;margin-left:10px">${title}</span>
    </div>
    <div style="padding:22px 20px">${inner}</div>
    <div style="border-top:2px solid #eee;padding:12px 20px;color:#999;font:11px/1.5 system-ui">GES — Global E-Commerce Saviours</div>
  </div>`;
}

/** 6-digit verification code email (the "sign up" step of booking). */
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  await sendViaResend({
    to,
    subject: `${code} is your GES verification code`,
    html: shell(
      "Verify your email",
      `<p style="color:#444;font:14px/1.6 system-ui;margin:0 0 14px">Use this code to finish booking your discovery call with GES:</p>
       <div style="font:800 34px/1 ui-monospace,monospace;letter-spacing:.18em;color:#0a0a0a;background:#f4f4ee;border:2px solid #0a0a0a;padding:16px 20px;text-align:center">${code}</div>
       <p style="color:#999;font:12px/1.6 system-ui;margin:14px 0 0">The code expires in 10 minutes. If you didn't request it, ignore this email.</p>`
    ),
  });
}

/** One-time welcome email after the first successful verification. */
export async function sendWelcomeEmail(to: string): Promise<void> {
  await sendViaResend({
    to,
    subject: "Welcome to GES 👋",
    html: shell(
      "Welcome to GES",
      `<p style="color:#111;font:800 18px/1.3 system-ui;margin:0 0 10px">Your email is verified — you're in.</p>
       <p style="color:#444;font:14px/1.7 system-ui;margin:0 0 10px">You can now book discovery calls with us in seconds. On the call we learn your business, then build you a tailored website preview — conversion-first design, lifelike 3D product experiences, and the automation to run it all.</p>
       <p style="color:#444;font:14px/1.7 system-ui;margin:0">Talk soon,<br/><strong>The GES team</strong></p>`
    ),
  });
}

/** Booking confirmation for the PROSPECT (with .ics attached). Best-effort. */
export async function sendBookingConfirmation(b: BookingInfo, manageUrl?: string): Promise<void> {
  const when = `${fmtDateFull(b.slot_date)} · ${fmtTime(b.slot_time)} ET`;
  const ics = buildIcs(b.name, b.email, b.slot_date, b.slot_time, b.notes ?? undefined);
  const manage = manageUrl
    ? `<p style="margin:18px 0 0"><a href="${manageUrl}" style="display:inline-block;background:#ccff00;color:#0a0a0a;font:700 13px/1 system-ui;text-decoration:none;padding:12px 18px;border:2px solid #0a0a0a">Reschedule or cancel →</a></p>
       <p style="color:#999;font:11px/1.6 system-ui;margin:10px 0 0">Plans change — manage your booking anytime with that link.</p>`
    : `<p style="color:#999;font:12px/1.6 system-ui;margin:0">Need to change it? Just reply to this email.</p>`;
  await sendViaResend({
    to: b.email,
    subject: `You're booked — GES discovery call · ${when}`,
    html: shell(
      "You're booked",
      `<p style="color:#111;font:800 20px/1.3 system-ui;margin:0 0 6px">${when}</p>
       <p style="color:#444;font:14px/1.7 system-ui;margin:0 0 12px">Your 30-minute discovery call with GES is confirmed, ${b.name}. The attached invite adds it to your calendar with a reminder.</p>
       ${manage}`
    ),
    attachments: [{ filename: "ges-discovery-call.ics", content: Buffer.from(ics).toString("base64") }],
  });
}

/** Dev diagnostic: report config + attempt a live test send, returning Resend's
    actual status/body so misconfig is obvious. Never throws. */
export async function emailDiagnostics(): Promise<Record<string, unknown>> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.BOOKING_NOTIFY_EMAIL;
  const from = process.env.BOOKING_FROM_EMAIL || "GES Bookings <onboarding@resend.dev>";
  const out: Record<string, unknown> = {
    hasKey: !!key,
    keyPrefix: key ? `${key.slice(0, 4)}…` : null,
    notifyTo: to ?? null,
    from,
  };
  if (!key || !to) {
    out.attempt = "skipped — RESEND_API_KEY and/or BOOKING_NOTIFY_EMAIL not set on the server";
    return out;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [to],
        subject: "GES — booking notifications test ✓",
        html: "<p>If you can read this, your GES booking email notifications are working. You can ignore this message.</p>",
      }),
    });
    out.attempt = { status: res.status, body: (await res.text()).slice(0, 500) };
  } catch (e) {
    out.attempt = { error: (e as Error).message };
  }
  return out;
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
