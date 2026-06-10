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

export type Stage = "new" | "viewed" | "deposit" | "delivered";
export type PricingModel = "buyout" | "rent";

export interface Client {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  status: "active" | "disabled";
  preview_ready: boolean;
  expires_at: string | null;
  created_at: string;
  // v2 pipeline/CRM fields — optional so the app still runs on a pre-migration DB.
  stage?: Stage;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  pricing_model?: PricingModel | null;
  quote?: string | null;
  view_count?: number;
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
 * Record a successful code entry: bump view_count + last_viewed_at and
 * auto-advance a 'new' client to 'viewed' (the sales signal that the prospect
 * actually opened their preview). Best-effort — a pre-migration DB without the
 * v2 columns just no-ops.
 */
export async function recordPreviewView(client: Client): Promise<void> {
  try {
    const patch: Record<string, unknown> = {
      view_count: (client.view_count ?? 0) + 1,
      last_viewed_at: new Date().toISOString(),
    };
    if (!client.stage || client.stage === "new") patch.stage = "viewed";
    await getSupabaseAdmin().from("clients").update(patch).eq("id", client.id);
  } catch {
    /* tracking must never block the client's login */
  }
}
