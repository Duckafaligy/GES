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
  industry: string | null;
  status: "active" | "disabled";
  preview_ready: boolean;
  expires_at: string | null;
  created_at: string;
}

const COLUMNS = "id, slug, name, industry, status, preview_ready, expires_at, created_at";

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
