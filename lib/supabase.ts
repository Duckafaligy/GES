import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PREVIEW_BUCKET = "client-previews";

let _admin: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service-role key.
 * NEVER import this into a client component — the key bypasses RLS.
 * Created lazily so the app doesn't crash at build time when env is absent.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
