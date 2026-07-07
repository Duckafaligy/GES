import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const COLUMNS = "id, name, email, business, notes, slot_date, slot_time, status, created_at";
const tableMissing = (msg = "") => /relation .*bookings.* does not exist|could not find the table|schema cache/i.test(msg);

export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getSupabaseAdmin()
    .from("bookings")
    .select(COLUMNS)
    .order("slot_date", { ascending: true })
    .order("slot_time", { ascending: true });
  if (error) {
    if (tableMissing(error.message)) return NextResponse.json({ bookings: [], needsMigration: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ bookings: data });
}

export async function PATCH(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();
  const status = String(body?.status ?? "").trim();
  if (!id || !["new", "done", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "id and a valid status are required." }, { status: 400 });
  }
  const { error } = await getSupabaseAdmin().from("bookings").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("bookings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
