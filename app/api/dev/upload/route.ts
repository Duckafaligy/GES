import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { getSupabaseAdmin, PREVIEW_BUCKET } from "@/lib/supabase";
import { listAllKeys } from "@/lib/storage";

export const runtime = "nodejs";

// One file per request — the dashboard walks the build folder and calls this per file.
export async function POST(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const rel = String(form.get("path") ?? "").trim().replace(/^\/+/, "");
  const file = form.get("file");

  if (!slug || !rel || !(file instanceof Blob)) {
    return NextResponse.json({ error: "slug, path and file are required." }, { status: 400 });
  }
  if (rel.includes("..")) return NextResponse.json({ error: "Invalid path." }, { status: 400 });

  const key = `${slug}/${rel}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  const { error } = await getSupabaseAdmin()
    .storage.from(PREVIEW_BUCKET)
    .upload(key, bytes, { upsert: true, contentType });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, key });
}

// Clean replace: wipe every existing file under the client's prefix so a new
// build doesn't merge with — and leave orphans from — the previous one. The
// dashboard calls this once before uploading the new build's files.
export async function DELETE(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const slug = String(body?.slug ?? "").trim();
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const keys = await listAllKeys(admin, slug);
  if (keys.length) {
    const { error } = await admin.storage.from(PREVIEW_BUCKET).remove(keys);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, cleared: keys.length });
}

