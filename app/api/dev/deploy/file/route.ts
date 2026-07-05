import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { isDev } from "@/lib/devAuth";
import { vercelUploadFile } from "@/lib/vercel";

export const runtime = "nodejs";

// Receives one project file, sha1-hashes it, and uploads it to Vercel.
// The dashboard calls this once per file, then sends the manifest to /create.
export async function POST(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "file is required." }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const sha = createHash("sha1").update(bytes).digest("hex");
    await vercelUploadFile(bytes, sha);
    return NextResponse.json({ sha, size: bytes.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
