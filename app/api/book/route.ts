import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SLOT_TIMES, isBookableDate, etToUtc, MEETING_MINUTES } from "@/lib/booking";
import { createBookingEvent } from "@/lib/gcal";
import { sendBookingEmail } from "@/lib/email";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const tableMissing = (msg = "") => /relation .*bookings.* does not exist|could not find the table|schema cache/i.test(msg);

// GET /api/book?date=YYYY-MM-DD → which slot times are already taken that day
// (times only — never any booker PII).
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date")?.trim() ?? "";
  if (!isBookableDate(date)) return NextResponse.json({ taken: [] });
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("bookings")
      .select("slot_time")
      .eq("slot_date", date)
      .neq("status", "cancelled");
    if (error) throw new Error(error.message);
    return NextResponse.json({ taken: (data ?? []).map((r) => (r as { slot_time: string }).slot_time) });
  } catch {
    // pre-migration or DB hiccup → nothing taken (booking POST will surface real errors)
    return NextResponse.json({ taken: [] });
  }
}

// POST /api/book → create a booking.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const business = String(body?.business ?? "").trim() || null;
  const notes = String(body?.notes ?? "").trim() || null;
  const slot_date = String(body?.slot_date ?? "").trim();
  const slot_time = String(body?.slot_time ?? "").trim();

  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (!isBookableDate(slot_date)) return NextResponse.json({ error: "Pick a valid weekday." }, { status: 400 });
  if (!(SLOT_TIMES as readonly string[]).includes(slot_time)) {
    return NextResponse.json({ error: "Pick a valid time slot." }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("bookings")
      .insert({ name, email, business, notes, slot_date, slot_time, status: "new" })
      .select("id, slot_date, slot_time")
      .single();

    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        return NextResponse.json({ error: "That slot was just taken — please pick another." }, { status: 409 });
      }
      if (tableMissing(error.message)) {
        return NextResponse.json(
          { error: "Booking isn't set up yet. Run the v3 bookings migration in Supabase." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Best-effort notifications — never block the lead. Email (Resend) pings you
    // instantly; the Google Calendar event fires too if those env vars are set.
    try {
      const start = etToUtc(slot_date, slot_time);
      const end = new Date(start.getTime() + MEETING_MINUTES * 60000);
      await Promise.allSettled([
        sendBookingEmail({ name, email, business, notes, slot_date, slot_time }),
        createBookingEvent({ name, email, business, notes, startISO: start.toISOString(), endISO: end.toISOString() }),
      ]);
    } catch (e) {
      console.error("booking notify failed (booking still saved):", (e as Error).message);
    }

    return NextResponse.json({ ok: true, booking: data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
