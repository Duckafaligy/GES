import { NextRequest, NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { emailConfigured, sendVerificationEmail } from "@/lib/email";
import { signToken, BOOKER_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const tableMissing = (msg = "") =>
  /relation .*booking_signups.* does not exist|could not find the table|schema cache/i.test(msg);

// POST /api/signup { email } → emails a 6-digit verification code.
// The booking flow requires verifying this code before a slot can be booked,
// which filters out junk bookings from made-up addresses.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  // No email system configured → can't verify anyone; let booking proceed
  // ungated rather than locking every prospect out.
  if (!emailConfigured()) {
    return NextResponse.json({ skipVerification: true, token: signToken("booker", email, BOOKER_TTL_MS) });
  }

  const code = String(randomInt(0, 1000000)).padStart(6, "0");
  try {
    const { error } = await getSupabaseAdmin().from("booking_signups").upsert({
      email,
      code_hash: sha256(code),
      code_expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    });
    if (error) {
      if (tableMissing(error.message)) {
        return NextResponse.json(
          { error: "Sign-up isn't set up yet. Run the v5 signups migration in Supabase." },
          { status: 503 }
        );
      }
      throw new Error(error.message);
    }
    await sendVerificationEmail(email, code);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    // Resend sandbox (no verified domain) can only email the account owner.
    if (/403|verify a domain|testing emails/i.test(msg)) {
      return NextResponse.json(
        { error: "We couldn't send to that address right now — please use the contact email below and we'll book you manually." },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: "Couldn't send the code — please try again." }, { status: 500 });
  }
}
