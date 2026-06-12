import { NextResponse } from "next/server";
import { getBookingSettings } from "@/lib/settings";
import { upcomingDays } from "@/lib/booking";

export const runtime = "nodejs";

// Public: the bookable days + time slots the modal should show.
export async function GET() {
  const s = await getBookingSettings();
  return NextResponse.json({ days: upcomingDays(s), times: s.times });
}
