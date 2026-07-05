import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isDev } from "@/lib/devAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TEMPLATE_BUCKET, THUMB_BUCKET } from "@/lib/templates";

export const runtime = "nodejs";

const COLS =
  "id, slug, title, tagline, description, category, tags, price_cents, thumbnail_url, demo_ready, demo_deploy_url, status, created_at";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

async function listAllKeys(admin: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  for (const entry of data ?? []) {
    const p = prefix ? `${prefix}/${entry.name}` : entry.name;
    if ((entry as { id: string | null }).id === null) out.push(...(await listAllKeys(admin, bucket, p)));
    else out.push(p);
  }
  return out;
}

export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getSupabaseAdmin().from("templates").select(COLS).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}

export async function POST(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = String(body?.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const base = slugify(body?.slug || title) || "template";
  const { data: taken } = await admin.from("templates").select("slug").like("slug", `${base}%`);
  const used = new Set((taken ?? []).map((r) => (r as { slug: string }).slug));
  let slug = base;
  let n = 1;
  while (used.has(slug)) { n++; slug = `${base}-${n}`; }

  const row = {
    slug,
    title,
    tagline: String(body?.tagline ?? "").trim() || null,
    description: String(body?.description ?? "").trim() || null,
    category: String(body?.category ?? "").trim() || null,
    price_cents: Number.isFinite(body?.price_cents) ? Math.max(0, Math.round(body.price_cents)) : 0,
    status: "draft",
  };
  const { data, error } = await admin.from("templates").insert(row).select(COLS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ template: data });
}

export async function PATCH(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = String(body?.slug ?? "").trim();
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const patch: Record<string, unknown> = {};
  for (const k of ["title", "tagline", "description", "category", "demo_deploy_url"] as const) {
    if (typeof body[k] === "string") patch[k] = body[k].trim() || null;
  }
  if (Number.isFinite(body?.price_cents)) patch.price_cents = Math.max(0, Math.round(body.price_cents));
  if (typeof body?.status === "string" && ["draft", "published"].includes(body.status)) patch.status = body.status;
  if (typeof body?.demo_ready === "boolean") patch.demo_ready = body.demo_ready;
  if (Array.isArray(body?.tags)) patch.tags = body.tags.map((x: unknown) => String(x)).filter(Boolean);
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const { data, error } = await getSupabaseAdmin().from("templates").update(patch).eq("slug", slug).select(COLS).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ template: data });
}

export async function DELETE(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const slug = String(body?.slug ?? "").trim();
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const admin = getSupabaseAdmin();
  try {
    const keys = await listAllKeys(admin, TEMPLATE_BUCKET, slug);
    if (keys.length) await admin.storage.from(TEMPLATE_BUCKET).remove(keys);
    const thumbs = await listAllKeys(admin, THUMB_BUCKET, slug);
    if (thumbs.length) await admin.storage.from(THUMB_BUCKET).remove(thumbs);
  } catch { /* best-effort */ }

  const { error } = await admin.from("templates").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
