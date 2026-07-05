import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TEMPLATE_BUCKET } from "@/lib/templates";

export const runtime = "nodejs";

// One demo-build file → templates/<slug>/demo/<path>. The dashboard walks the
// folder; once done it PATCHes the template demo_ready = true.
export async function POST(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const rel = String(form.get("path") ?? "").trim().replace(/^\/+/, "");
  const file = form.get("file");
  if (!slug || !rel || !(file instanceof Blob)) return NextResponse.json({ error: "slug, path, file required." }, { status: 400 });
  if (rel.includes("..")) return NextResponse.json({ error: "Invalid path." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await getSupabaseAdmin()
    .storage.from(TEMPLATE_BUCKET)
    .upload(`${slug}/demo/${rel}`, bytes, { upsert: true, contentType: file.type || "application/octet-stream" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
