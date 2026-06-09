import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { generateAccessCode, hashCode } from "@/lib/clients";
import { getSupabaseAdmin, PREVIEW_BUCKET } from "@/lib/supabase";
import { listAllKeys } from "@/lib/storage";

export const runtime = "nodejs";

const COLUMNS = "id, slug, name, industry, status, preview_ready, expires_at, created_at";

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

  const { data, error } = await admin
    .from("clients")
    .insert({ slug: candidate, name, industry, code_hash: hashCode(code), status: "active", preview_ready: false })
    .select(COLUMNS)
    .single();

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

  const patch: Record<string, unknown> = {};
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
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
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
