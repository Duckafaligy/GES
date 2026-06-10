import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { generateAccessCode, hashCode } from "@/lib/clients";
import { getSupabaseAdmin, PREVIEW_BUCKET } from "@/lib/supabase";
import { listAllKeys } from "@/lib/storage";

export const runtime = "nodejs";

// Select everything that exists so the dashboard works before AND after the
// v2 pipeline migration (an explicit v2 column list would 400 on an old DB).
const COLUMNS = "*";

const STAGES = ["new", "viewed", "deposit", "delivered"] as const;
const PRICING_MODELS = ["buyout", "rent"] as const;

/** Pull the optional CRM/pipeline fields out of a request body (trimmed, '' → null). */
function crmFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of ["contact_email", "contact_phone", "notes", "quote"] as const) {
    if (typeof body[key] === "string") out[key] = (body[key] as string).trim() || null;
  }
  if (typeof body.stage === "string" && (STAGES as readonly string[]).includes(body.stage)) {
    out.stage = body.stage;
  }
  if (body.pricing_model === null) out.pricing_model = null;
  else if (
    typeof body.pricing_model === "string" &&
    (PRICING_MODELS as readonly string[]).includes(body.pricing_model)
  ) {
    out.pricing_model = body.pricing_model;
  }
  return out;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getSupabaseAdmin()
    .from("clients")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clients: data });
}

export async function POST(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const industry = String(body?.industry ?? "").trim() || null;
  const slugInput = String(body?.slug ?? "").trim();

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  // Codes are always generated here — a 64-char random string. We store only its
  // hash and return the plaintext once so the dev can copy it across to the client.
  const code = generateAccessCode(64);

  const base = (slugInput ? slugify(slugInput) : slugify(name)) || "client";

  const admin = getSupabaseAdmin();
  // Auto-pick a free slug (suffix on collision) so similar names don't clash.
  const { data: taken } = await admin.from("clients").select("slug").like("slug", `${base}%`);
  const used = new Set((taken ?? []).map((r) => (r as { slug: string }).slug));
  let candidate = base;
  let n = 1;
  while (used.has(candidate)) { n++; candidate = `${base}-${n}`; }

  const base_row = { slug: candidate, name, industry, code_hash: hashCode(code), status: "active", preview_ready: false };
  let { data, error } = await admin
    .from("clients")
    .insert({ ...base_row, ...crmFields(body) })
    .select(COLUMNS)
    .single();

  // Pre-migration DB (v2 columns absent): retry with the base columns only.
  if (error && /column .* does not exist|could not find/i.test(error.message)) {
    ({ data, error } = await admin.from("clients").insert(base_row).select(COLUMNS).single());
  }

  if (error) {
    const msg = /duplicate|unique/i.test(error.message)
      ? "A client with that slug already exists — try a slightly different name."
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ client: data, code });
}

export async function PATCH(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = String(body?.slug ?? "").trim();
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const patch: Record<string, unknown> = { ...crmFields(body) };
  if (typeof body.status === "string" && ["active", "disabled"].includes(body.status)) patch.status = body.status;
  if (typeof body.preview_ready === "boolean") patch.preview_ready = body.preview_ready;

  // Optionally mint a fresh 64-char code (old one stops working) and return it once.
  let newCode: string | null = null;
  if (body.regenerate === true) {
    newCode = generateAccessCode(64);
    patch.code_hash = hashCode(newCode);
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("clients")
    .update(patch)
    .eq("slug", slug)
    .select(COLUMNS)
    .single();
  if (error) {
    const msg = /column .* does not exist|could not find/i.test(error.message)
      ? "Your database is missing the v2 pipeline columns — run supabase/migrations/2026-06-10-v2-pipeline.sql in the Supabase SQL editor."
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ client: data, code: newCode });
}

export async function DELETE(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = String(body?.slug ?? "").trim();
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const admin = getSupabaseAdmin();
  // Remove every stored file for this client (recursively), then the row.
  try {
    const keys = await listAllKeys(admin, slug);
    if (keys.length) await admin.storage.from(PREVIEW_BUCKET).remove(keys);
  } catch { /* best-effort cleanup — still delete the row below */ }

  const { error } = await admin.from("clients").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
