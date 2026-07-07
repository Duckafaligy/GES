import { createHash, randomBytes } from "crypto";
import { getSupabaseAdmin } from "./supabase";

// 62-char alphabet (A–Z, a–z, 0–9) for human-transferable access codes.
const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Crypto-strong random access code: `length` chars of A–Z a–z 0–9.
 * Uses rejection sampling (drop bytes ≥ 248 = 62×4) so every char is unbiased.
 * 64 chars ≈ 381 bits of entropy — effectively impossible to guess or brute-force.
 */
export function generateAccessCode(length = 64): string {
  const out: string[] = [];
  while (out.length < length) {
    const buf = randomBytes(length);
    for (let i = 0; i < buf.length && out.length < length; i++) {
      const v = buf[i];
      if (v < 248) out.push(CODE_ALPHABET[v % 62]);
    }
  }
  return out.join("");
}

export interface Client {
  id: string;
  slug: string;
  name: string;
  status: "active" | "disabled";
  preview_ready: boolean;
  expires_at: string | null;
  created_at: string;
  // v2 fields — optional so the app still runs on a pre-migration DB.
  deploy_url?: string | null;    // Vercel deployment URL (preview iframes it if set)
  dob?: string | null;           // client's date of birth — personal 2nd login factor
  access_code?: string | null;   // plaintext, kept for recovery (see access_code column)
  view_count?: number;
  first_viewed_at?: string | null;
  last_viewed_at?: string | null;
}

// Select everything that exists so the same code works before and after the
// v2 migration (an explicit list of v2 columns would 400 on an old DB).
const COLUMNS = "*";

/** SHA-256 of an access code — what we store, never the plaintext. */
export function hashCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

/** Look up an active, non-expired client by their access code. */
export async function findClientByCode(code: string): Promise<Client | null> {
  const hash = hashCode(code);
  const { data, error } = await getSupabaseAdmin()
    .from("clients")
    .select(COLUMNS)
    .eq("code_hash", hash)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;
  const client = data as Client;
  if (client.expires_at && new Date(client.expires_at).getTime() < Date.now()) return null;
  return client;
}

/** Look up a client by slug (used by the gated preview route). */
export async function findClientBySlug(slug: string): Promise<Client | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("clients")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as Client;
}

/**
 * Record a successful code entry (the prospect opened their preview): append a
 * row to the client_views event log and bump the aggregate counters on the
 * client. Best-effort — never blocks the client's login, and a pre-migration DB
 * without the v2 tables/columns simply no-ops.
 */
export async function recordPreviewView(client: Client): Promise<void> {
  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  // Event log (timeline) — separate try so a missing table doesn't skip the counters.
  try {
    await admin.from("client_views").insert({ client_id: client.id, viewed_at: now });
  } catch { /* table may not exist pre-migration */ }
  // Aggregate counters for fast list display.
  try {
    await admin
      .from("clients")
      .update({
        view_count: (client.view_count ?? 0) + 1,
        last_viewed_at: now,
        first_viewed_at: client.first_viewed_at ?? now,
      })
      .eq("id", client.id);
  } catch { /* columns may not exist pre-migration */ }
}

/** Recent view timestamps for a client (newest first) — powers the analytics panel. */
export async function listClientViews(clientId: string, limit = 50): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("client_views")
    .select("viewed_at")
    .eq("client_id", clientId)
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as { viewed_at: string }[]).map((r) => r.viewed_at);
}
