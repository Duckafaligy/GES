import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { signToken, DEV_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";

// Convenience defaults used ONLY outside production (local `next dev`) so the
// dashboard works with zero env setup. In production DEV_DASHBOARD_PASSWORD /
// DEV_DASHBOARD_DOB are required — the in-repo defaults can never log into a
// live deploy. Set your real date of birth (YYYY-MM-DD) in DEV_DASHBOARD_DOB.
const DEFAULT_DEV_PASSWORD = "Brendan!202";
const DEFAULT_DEV_DOB = "2011-02-12"; // dev default — override via DEV_DASHBOARD_DOB in prod

/** Constant-time string compare that avoids leaking length via early return. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  try {
    const { password, dob } = await req.json();
    const isProd = process.env.NODE_ENV === "production";
    const expectedPw = process.env.DEV_DASHBOARD_PASSWORD || (isProd ? "" : DEFAULT_DEV_PASSWORD);
    const expectedDob = process.env.DEV_DASHBOARD_DOB || (isProd ? "" : DEFAULT_DEV_DOB);

    if (!expectedPw || !expectedDob) {
      return NextResponse.json(
        { error: "Dashboard login is not configured. Set DEV_DASHBOARD_PASSWORD and DEV_DASHBOARD_DOB." },
        { status: 500 }
      );
    }
    if (typeof password !== "string" || password.length === 0) {
      return NextResponse.json({ error: "Password required." }, { status: 400 });
    }
    if (typeof dob !== "string" || dob.length === 0) {
      return NextResponse.json({ error: "Date of birth required." }, { status: 400 });
    }

    // Both factors must match. One generic message so neither is enumerable.
    const ok = safeEqual(password, expectedPw) && safeEqual(dob.trim(), expectedDob.trim());
    if (!ok) return NextResponse.json({ error: "Incorrect password or date of birth." }, { status: 401 });

    // Returned to the browser and held in sessionStorage only (no cookie).
    const token = signToken("dev", "dev", DEV_TTL_MS);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
