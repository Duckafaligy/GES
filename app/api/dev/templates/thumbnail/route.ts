import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { THUMB_BUCKET } from "@/lib/templates";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const file = form.get("file");
  if (!slug || !(file instanceof Blob)) return NextResponse.json({ error: "slug and file required." }, { status: 400 });

  const name = (file as File).name ?? "thumb.png";
  const ext = name.split(".").pop()?.toLowerCase() || "png";
  const key = `${slug}/thumb.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(THUMB_BUCKET).upload(key, bytes, { upsert: true, contentType: file.type || "image/png" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const url = admin.storage.from(THUMB_BUCKET).getPublicUrl(key).data.publicUrl;
  await admin.from("templates").update({ thumbnail_url: url }).eq("slug", slug);
  return NextResponse.json({ url });
}
