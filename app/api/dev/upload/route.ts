import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { getSupabaseAdmin, PREVIEW_BUCKET } from "@/lib/supabase";

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
