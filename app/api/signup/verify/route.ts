import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email";
import { signToken, BOOKER_TTL_MS } from "@/lib/session";
import { checkLock, registerFailure, registerSuccess, clientIp } from "@/lib/throttle";

export const runtime = "nodejs";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

const lockResponse = (msg: string, ms: number) =>
  NextResponse.json({ error: msg }, { status: 429, headers: { "Retry-After": String(Math.ceil(ms / 1000)) } });

// POST /api/signup/verify { email, code } → checks the 6-digit code, sends the
// one-time welcome email on first verification, returns a short-lived signed
// booker token that /api/book requires.
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const lock = await checkLock("signup-verify", ip);
  if (lock.locked) return lockResponse(lock.message, lock.retryAfterMs);

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase();
  const code = String(body?.code ?? "").trim();
  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("booking_signups")
    .select("email, code_hash, code_expires_at, verified_at, welcome_sent_at")
    .eq("email", email)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: "Request a new code and try again." }, { status: 400 });
  }

  const row = data as { code_hash: string | null; code_expires_at: string | null; verified_at: string | null; welcome_sent_at: string | null };
  if (!row.code_hash || !row.code_expires_at || new Date(row.code_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "That code expired — request a new one." }, { status: 400 });
  }
  const a = Buffer.from(sha256(code));
  const b = Buffer.from(row.code_hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    const after = await registerFailure("signup-verify", ip);
    if (after.locked) return lockResponse(after.message, after.retryAfterMs);
    return NextResponse.json({ error: "Wrong code — check the email and try again." }, { status: 401 });
  }
  await registerSuccess("signup-verify", ip);

  // Mark verified, clear the used code, send the one-time welcome email.
  const firstTime = !row.verified_at;
  const patch: Record<string, unknown> = {
    verified_at: row.verified_at ?? new Date().toISOString(),
    code_hash: null,
    code_expires_at: null,
  };
  if (firstTime && !row.welcome_sent_at) {
    try {
      await sendWelcomeEmail(email);
      patch.welcome_sent_at = new Date().toISOString();
    } catch { /* welcome email is a nicety — never block verification */ }
  }
  await admin.from("booking_signups").update(patch).eq("email", email);

  return NextResponse.json({ token: signToken("booker", email, BOOKER_TTL_MS), welcome: firstTime });
}
