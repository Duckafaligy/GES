/**
 * Add (or update) a GES client directly in Supabase from the CLI.
 *
 * Usage:
 *   node --env-file=.env.local scripts/add-client.mjs "Business Name" [slug]
 *
 * A 64-character access code is generated automatically, stored (hash + plaintext
 * for recovery) and printed. Re-running for an existing slug rotates the code.
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 * After adding, upload the client's built site in the dashboard
 * (/Developer-Dashboard-Page) or into Storage → client-previews/<slug>/.
 */
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [, , name, slugArg] = process.argv;

if (!name) {
  console.error('Usage: node --env-file=.env.local scripts/add-client.mjs "Business Name" [slug]');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env. Try: node --env-file=.env.local scripts/add-client.mjs ...");
  process.exit(1);
}

// 64-char A–Z a–z 0–9 code, unbiased (reject bytes >= 248 = 62*4).
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function generateAccessCode(length = 64) {
  const out = [];
  while (out.length < length) {
    const buf = randomBytes(length);
    for (let i = 0; i < buf.length && out.length < length; i++) {
      if (buf[i] < 248) out.push(ALPHABET[buf[i] % 62]);
    }
  }
  return out.join("");
}

const slug = (slugArg || name)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 60);

const code = generateAccessCode(64);
const code_hash = createHash("sha256").update(code).digest("hex");

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from("clients")
  .upsert(
    { slug, name, code_hash, access_code: code, status: "active", preview_ready: false },
    { onConflict: "slug" }
  )
  .select("slug, name, status, preview_ready")
  .single();

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

console.log("\n✓ Client saved:");
console.table(data);
console.log(`\nAccess code (shown once — store it safely):\n\n  ${code}\n`);
console.log(`Next: upload ${slug}'s build folder in /Developer-Dashboard-Page (or Storage → client-previews/${slug}/), then mark it ready.\n`);
