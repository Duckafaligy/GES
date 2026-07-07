import type { SupabaseClient } from "@supabase/supabase-js";
import { PREVIEW_BUCKET } from "./supabase";

/**
 * Recursively collect every object key under a storage prefix.
 * Supabase Storage `list` is shallow and returns folder placeholders with a
 * null id, so we recurse into those to walk the whole tree.
 */
export async function listAllKeys(admin: SupabaseClient, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data } = await admin.storage.from(PREVIEW_BUCKET).list(prefix, { limit: 1000 });
  for (const entry of data ?? []) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if ((entry as { id: string | null }).id === null) out.push(...(await listAllKeys(admin, path)));
    else out.push(path);
  }
  return out;
}
