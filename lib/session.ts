import { createHmac, timingSafeEqual } from "crypto";

// Short-lived, stateless, signed tokens. No cookies, no server-side session store.
export const PREVIEW_TTL_MS = 2 * 60 * 60 * 1000; // client preview access — 2 hours
export const DEV_TTL_MS = 8 * 60 * 60 * 1000; // developer dashboard — 8 hours

type Purpose = "preview" | "dev";

interface Payload {
  p: Purpose;
  sub: string; // preview → client slug; dev → "dev"
  exp: number; // epoch ms
}

// Fallback used only when SESSION_SECRET is unset, so the dashboard + previews
// work out of the box with no env setup. ⚠ It is public (it lives in the repo),
// which makes tokens forgeable — ALWAYS set a real SESSION_SECRET in production
// (.env.local locally, Project → Settings → Environment Variables on Vercel).
const DEFAULT_SECRET = "ges-dev-insecure-default-secret-set-SESSION_SECRET-in-prod";

function secret(): string {
  return process.env.SESSION_SECRET || DEFAULT_SECRET;
}

const b64u = (buf: Buffer) => buf.toString("base64url");

/** Returns `<base64url(payload)>.<base64url(hmac)>`. */
export function signToken(purpose: Purpose, sub: string, ttlMs: number): string {
  const payload: Payload = { p: purpose, sub, exp: Date.now() + ttlMs };
  const body = b64u(Buffer.from(JSON.stringify(payload)));
  const sig = b64u(createHmac("sha256", secret()).update(body).digest());
  return `${body}.${sig}`;
}

/** Verifies signature, purpose, and expiry. Returns the payload or null. */
export function verifyToken(token: string, purpose: Purpose): Payload | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = b64u(createHmac("sha256", secret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (payload.p !== purpose) return null;
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
  return payload;
}
