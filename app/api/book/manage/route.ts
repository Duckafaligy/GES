import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyToken } from "@/lib/session";
import { isSlotBookable, upcomingDays } from "@/lib/booking";
import { getBookingSettings } from "@/lib/settings";

export const runtime = "nodejs";

const COLUMNS = "id, name, email, business, notes, slot_date, slot_time, status";

function bookingId(token: string | null): string | null {
  if (!token) return null;
  const p = verifyToken(token, "manage");
  return p ? p.sub : null;
}

// GET /api/book/manage?token=… → the booking + current availability (for reschedule).
export async function GET(req: NextRequest) {
  const id = bookingId(req.nextUrl.searchParams.get("token"));
  if (!id) return NextResponse.json({ error: "This link is invalid or expired." }, { status: 401 });

  const { data, error } = await getSupabaseAdmin().from("bookings").select(COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const s = await getBookingSettings();
  return NextResponse.json({ booking: data, days: upcomingDays(s), times: s.times });
}

// POST /api/book/manage { token, action: "cancel" | "reschedule", slot_date?, slot_time? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = bookingId(String(body?.token ?? ""));
  if (!id) return NextResponse.json({ error: "This link is invalid or expired." }, { status: 401 });

  const admin = getSupabaseAdmin();
  const action = String(body?.action ?? "");

  if (action === "cancel") {
    const { error } = await admin.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  if (action === "reschedule") {
    const slot_date = String(body?.slot_date ?? "").trim();
    const slot_time = String(body?.slot_time ?? "").trim();
    const s = await getBookingSettings();
    if (!isSlotBookable(s, slot_date, slot_time)) {
      return NextResponse.json({ error: "That slot isn't available — pick another." }, { status: 400 });
    }
    const { data, error } = await admin
      .from("bookings")
      .update({ slot_date, slot_time, status: "new" })
      .eq("id", id)
      .select("id, slot_date, slot_time")
      .single();
    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        return NextResponse.json({ error: "That slot was just taken — pick another." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, booking: data });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
