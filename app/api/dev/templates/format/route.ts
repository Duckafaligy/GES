import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TEMPLATE_BUCKET } from "@/lib/templates";

export const runtime = "nodejs";

// List a template's formats (for the dashboard editor).
export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ error: "slug required." }, { status: 400 });
  const admin = getSupabaseAdmin();
  const { data: tpl } = await admin.from("templates").select("id").eq("slug", slug).maybeSingle();
  if (!tpl) return NextResponse.json({ formats: [] });
  const { data } = await admin
    .from("template_formats")
    .select("*")
    .eq("template_id", (tpl as { id: string }).id)
    .order("price_cents", { ascending: true });
  return NextResponse.json({ formats: data ?? [] });
}

// Create/replace a format + its artifact (.zip — either a real zip or a client-zipped folder).
export async function POST(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const kind = String(form.get("kind") ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "") || "raw";
  const label = String(form.get("label") ?? "").trim();
  const license = String(form.get("license") ?? "").trim() || null;
  const price_cents = Math.max(0, Math.round(Number(form.get("price_cents") ?? 0)));
  const file = form.get("file");
  if (!slug || !label || !(file instanceof Blob)) {
    return NextResponse.json({ error: "slug, label and a file are required." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: tpl } = await admin.from("templates").select("id").eq("slug", slug).maybeSingle();
  if (!tpl) return NextResponse.json({ error: "Template not found." }, { status: 404 });
  const templateId = (tpl as { id: string }).id;

  const key = `${slug}/formats/${kind}.zip`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage.from(TEMPLATE_BUCKET).upload(key, bytes, { upsert: true, contentType: "application/zip" });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  const rowData = { template_id: templateId, kind, label, price_cents, license, storage_key: key, size_bytes: bytes.length };
  const { data: existing } = await admin
    .from("template_formats")
    .select("id")
    .eq("template_id", templateId)
    .eq("kind", kind)
    .maybeSingle();

  const res = existing
    ? await admin.from("template_formats").update(rowData).eq("id", (existing as { id: string }).id).select("*").single()
    : await admin.from("template_formats").insert(rowData).select("*").single();

  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 400 });
  return NextResponse.json({ format: res.data });
}

export async function DELETE(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  const admin = getSupabaseAdmin();
  const { data: fmt } = await admin.from("template_formats").select("storage_key").eq("id", id).maybeSingle();
  const key = (fmt as { storage_key: string | null } | null)?.storage_key;
  if (key) { try { await admin.storage.from(TEMPLATE_BUCKET).remove([key]); } catch { /* ignore */ } }
  const { error } = await admin.from("template_formats").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
