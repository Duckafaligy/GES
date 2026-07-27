import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/session";
import { findClientBySlug } from "@/lib/clients";
import { getSupabaseAdmin, PREVIEW_BUCKET } from "@/lib/supabase";
import { listAllKeys } from "@/lib/storage";
import { createZip, type ZipEntry } from "@/lib/zip";

export const runtime = "nodejs";

// Client-facing export: lets the business owner download their own preview as a
// .zip — the mirror of the developer's folder import. Gated by the same
// short-lived preview token that /raw/<token> uses, passed as a Bearer header so
// it never lands in a URL, browser history, or a server access log.
//
// Access is re-checked against the live client row on every request (exactly
// like /raw), so disabling or deleting a client instantly revokes downloads too.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";

  const payload = verifyToken(token, "preview");
  if (!payload) {
    return NextResponse.json(
      { error: "Your session expired. Please re-enter your access code." },
      { status: 401 }
    );
  }

  const client = await findClientBySlug(payload.sub);
  if (!client || client.status !== "active") {
    return NextResponse.json(
      { error: "This preview is no longer available." },
      { status: 403 }
    );
  }
  if (!client.preview_ready) {
    return NextResponse.json(
      { error: "This preview isn't published yet, so there's nothing to download." },
      { status: 409 }
    );
  }

  const admin = getSupabaseAdmin();
  const keys = await listAllKeys(admin, client.slug);
  if (keys.length === 0) {
    return NextResponse.json({ error: "There are no files to download yet." }, { status: 404 });
  }

  const entries: ZipEntry[] = [];
  for (const key of keys) {
    const { data, error } = await admin.storage.from(PREVIEW_BUCKET).download(key);
    if (error || !data) continue;
    const bytes = new Uint8Array(await data.arrayBuffer());
    // Strip the "<slug>/" prefix so the archive extracts to the build root.
    entries.push({ path: key.slice(client.slug.length + 1), data: bytes });
  }

  if (entries.length === 0) {
    return NextResponse.json({ error: "Could not read your preview files." }, { status: 502 });
  }

  const zip = createZip(entries);
  return new NextResponse(zip, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${client.slug}.zip"`,
      "content-length": String(zip.length),
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}
