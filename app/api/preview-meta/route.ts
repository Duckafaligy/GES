import { NextRequest, NextResponse } from "next/server";
import { findClientBySlug } from "@/lib/clients";

export const runtime = "nodejs";

// Public, non-sensitive metadata for the preview gate page so it can greet the
// prospect by business name ("Preview for Blooms & Co."). The slug is already
// in the URL we give the client, so the name reveals nothing new; codes,
// hashes, notes and pipeline data are never returned here.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("business")?.trim() ?? "";
  if (!slug) return NextResponse.json({ error: "business is required." }, { status: 400 });

  try {
    const client = await findClientBySlug(slug);
    if (!client || client.status !== "active") {
      return NextResponse.json({ found: false }, { status: 404 });
    }
    return NextResponse.json({
      found: true,
      name: client.name,
      industry: client.industry,
      ready: client.preview_ready,
    });
  } catch {
    // DB unreachable — the gate just falls back to its generic copy.
    return NextResponse.json({ found: false }, { status: 503 });
  }
}
