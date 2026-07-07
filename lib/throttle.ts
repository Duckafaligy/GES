import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "./supabase";

/**
 * Apple-style escalating per-IP auth lockout, backed by the `auth_throttle`
 * table (v7 migration) so it survives across serverless instances/cold starts.
 *
 * Rules: 5 wrong attempts → 1-minute lock. Every further wrong attempt after a
 * lock escalates the next tier (5m → 15m → 60m, then capped). A successful
 * auth clears the record. Fails OPEN if the table doesn't exist yet (so the app
 * keeps working before the migration runs) — run the v7 migration to activate.
 */

const FAILS_BEFORE_FIRST_LOCK = 5;
// Lock durations per escalation tier (ms): 1m, 5m, 15m, 60m (last is the cap).
const TIERS_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];

export type Scope = "dev-login" | "signup-verify" | "verify-code";

interface Row {
  id: string;
  fails: number;
  lock_level: number;
  lock_until: string | null;
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

const keyFor = (scope: Scope, ip: string) => `${scope}:${ip}`;

function humanWait(ms: number): string {
  const mins = Math.ceil(ms / 60_000);
  if (mins <= 1) return "1 minute";
  if (mins < 60) return `${mins} minutes`;
  const hrs = Math.round(mins / 60);
  return hrs === 1 ? "1 hour" : `${hrs} hours`;
}

export interface ThrottleState {
  locked: boolean;
  retryAfterMs: number;
  message: string;
}

/**
 * Call BEFORE checking the credential. If `locked` is true, reject the request
 * with 429 and the provided message (don't even verify the secret).
 */
export async function checkLock(scope: Scope, ip: string): Promise<ThrottleState> {
  const ok: ThrottleState = { locked: false, retryAfterMs: 0, message: "" };
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("auth_throttle")
      .select("id, fails, lock_level, lock_until")
      .eq("id", keyFor(scope, ip))
      .maybeSingle();
    if (error || !data) return ok;
    const row = data as Row;
    if (row.lock_until) {
      const remaining = new Date(row.lock_until).getTime() - Date.now();
      if (remaining > 0) {
        return {
          locked: true,
          retryAfterMs: remaining,
          message: `Too many attempts. Try again in ${humanWait(remaining)}.`,
        };
      }
    }
    return ok;
  } catch {
    return ok; // table missing / DB down → fail open
  }
}

/**
 * Call AFTER a failed credential check. Increments the counter and applies the
 * next lockout tier when the threshold is reached. Returns the resulting state
 * so the caller can tell the user how long they're now locked out.
 */
export async function registerFailure(scope: Scope, ip: string): Promise<ThrottleState> {
  const ok: ThrottleState = { locked: false, retryAfterMs: 0, message: "" };
  try {
    const admin = getSupabaseAdmin();
    const id = keyFor(scope, ip);
    const { data } = await admin
      .from("auth_throttle")
      .select("id, fails, lock_level, lock_until")
      .eq("id", id)
      .maybeSingle();
    const cur = (data as Row | null) ?? { id, fails: 0, lock_level: 0, lock_until: null };

    let { fails, lock_level } = cur;
    fails += 1;
    let lockUntil: string | null = null;

    // Once an IP has been locked at least once, any further wrong attempt
    // immediately escalates. Before the first lock, allow up to N attempts.
    if (lock_level > 0 || fails >= FAILS_BEFORE_FIRST_LOCK) {
      lock_level += 1;
      const ms = TIERS_MS[Math.min(lock_level - 1, TIERS_MS.length - 1)];
      lockUntil = new Date(Date.now() + ms).toISOString();
      fails = 0; // reset the per-window counter once locked
      await admin.from("auth_throttle").upsert({
        id, fails, lock_level, lock_until: lockUntil, updated_at: new Date().toISOString(),
      });
      return { locked: true, retryAfterMs: ms, message: `Too many attempts. Try again in ${humanWait(ms)}.` };
    }

    await admin.from("auth_throttle").upsert({
      id, fails, lock_level, lock_until: null, updated_at: new Date().toISOString(),
    });
    return ok;
  } catch {
    return ok; // fail open
  }
}

/** Call after a SUCCESSFUL auth — clears the IP's failure record. */
export async function registerSuccess(scope: Scope, ip: string): Promise<void> {
  try {
    await getSupabaseAdmin().from("auth_throttle").delete().eq("id", keyFor(scope, ip));
  } catch { /* best-effort */ }
}
