import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { signToken, PREVIEW_TTL_MS } from "@/lib/session";
import { findClientBySlug } from "@/lib/clients";

export const runtime = "nodejs";

// Lets a logged-in developer preview a client's build straight from the
// dashboard ("View") without entering the client's access code. The dashboard
// calls this with its Bearer token, then opens /raw/<token> in a new tab.
export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug")?.trim() ?? "";
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const client = await findClientBySlug(slug);
  if (!client) return NextResponse.json({ error: "No such client." }, { status: 404 });
  if (!client.preview_ready) {
    return NextResponse.json(
      { error: "No build uploaded yet — upload one (or Publish) before viewing." },
      { status: 409 }
    );
  }

  const token = signToken("preview", slug, PREVIEW_TTL_MS);
  return NextResponse.json({ token });
}
