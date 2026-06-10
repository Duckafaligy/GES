import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { signToken, DEV_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";

// Convenience default used ONLY outside production (local `next dev`) so the
// dashboard works with zero env setup. In production DEV_DASHBOARD_PASSWORD is
// required — the in-repo default can never be used to log into a live deploy.
const DEFAULT_DEV_PASSWORD = "Brendan!202";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expected =
      process.env.DEV_DASHBOARD_PASSWORD ||
      (process.env.NODE_ENV !== "production" ? DEFAULT_DEV_PASSWORD : "");

    if (!expected) {
      return NextResponse.json(
        { error: "Dashboard password is not configured. Set DEV_DASHBOARD_PASSWORD." },
        { status: 500 }
      );
    }
    if (typeof password !== "string" || password.length === 0) {
      return NextResponse.json({ error: "Password required." }, { status: 400 });
    }

    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    if (!ok) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });

    // Returned to the browser and held in sessionStorage only (no cookie).
    const token = signToken("dev", "dev", DEV_TTL_MS);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
