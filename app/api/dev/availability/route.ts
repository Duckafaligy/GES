import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { getBookingSettings, saveBookingSettings } from "@/lib/settings";
import { ALL_SLOT_TIMES } from "@/lib/booking";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await getBookingSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const weekdays: number[] | null = Array.isArray(body?.weekdays)
    ? [...new Set((body.weekdays as unknown[]).map((x) => Number(x)))].filter((n) => n >= 0 && n <= 6).sort((a, b) => a - b)
    : null;
  const times: string[] | null = Array.isArray(body?.times)
    ? (body.times as unknown[]).filter((t): t is string => typeof t === "string" && (ALL_SLOT_TIMES as string[]).includes(t)).sort()
    : null;
  const blocked: string[] | null = Array.isArray(body?.blocked)
    ? [...new Set((body.blocked as unknown[]).filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort()
    : null;
  const horizonDays = Number.isFinite(body?.horizonDays) ? Math.min(60, Math.max(1, Math.floor(body.horizonDays))) : null;

  if (!weekdays || !times || !blocked || horizonDays === null) {
    return NextResponse.json({ error: "weekdays, times, blocked and horizonDays are required." }, { status: 400 });
  }
  if (weekdays.length === 0 || times.length === 0) {
    return NextResponse.json({ error: "Enable at least one weekday and one time slot." }, { status: 400 });
  }

  try {
    await saveBookingSettings({ weekdays, times, blocked, horizonDays });
    return NextResponse.json({ ok: true, settings: { weekdays, times, blocked, horizonDays } });
  } catch (e) {
    const msg = /relation .*booking_settings.* does not exist|schema cache/i.test((e as Error).message)
      ? "Run supabase/migrations/2026-06-11-v4-availability.sql in the Supabase SQL editor first."
      : (e as Error).message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
