import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { getSupabaseAdmin, PREVIEW_BUCKET } from "@/lib/supabase";
import { listAllKeys } from "@/lib/storage";
import { createZip, type ZipEntry } from "@/lib/zip";

export const runtime = "nodejs";

// Streams a ZIP of a client's uploaded build so the developer can keep a copy
// or hand it over. Dev-gated via the Bearer token; the dashboard fetches it and
// saves the blob, so the token never ends up in the URL.
export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug")?.trim() ?? "";
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const keys = await listAllKeys(admin, slug);
  if (keys.length === 0) {
    return NextResponse.json({ error: "Nothing uploaded for this client yet." }, { status: 404 });
  }

  const entries: ZipEntry[] = [];
  for (const key of keys) {
    const { data, error } = await admin.storage.from(PREVIEW_BUCKET).download(key);
    if (error || !data) continue;
    const bytes = new Uint8Array(await data.arrayBuffer());
    // Strip the "<slug>/" prefix so the archive extracts to the build root.
    entries.push({ path: key.slice(slug.length + 1), data: bytes });
  }

  if (entries.length === 0) {
    return NextResponse.json({ error: "Could not read any files for this client." }, { status: 502 });
  }

  const zip = createZip(entries);
  return new NextResponse(zip, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${slug}.zip"`,
      "content-length": String(zip.length),
      "cache-control": "no-store",
    },
  });
}
