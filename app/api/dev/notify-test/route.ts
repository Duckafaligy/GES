import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { emailDiagnostics } from "@/lib/email";
import { gcalConfigured } from "@/lib/gcal";

export const runtime = "nodejs";

// Dev-only: shows whether email/calendar notifications are configured and does a
// live Resend test-send, surfacing the exact response so misconfig is obvious.
export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const email = await emailDiagnostics();
  return NextResponse.json({ email, googleCalendar: { configured: gcalConfigured() } });
}
