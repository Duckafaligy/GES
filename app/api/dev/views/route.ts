import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { findClientBySlug, listClientViews } from "@/lib/clients";

export const runtime = "nodejs";

// Viewer analytics for one client: aggregate counters + a timeline of recent
// opens (each successful access-code entry). Dev-gated.
export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug")?.trim() ?? "";
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const client = await findClientBySlug(slug);
  if (!client) return NextResponse.json({ error: "No such client." }, { status: 404 });

  let views: string[] = [];
  try {
    views = await listClientViews(client.id, 100);
  } catch {
    /* client_views table may not exist pre-migration → empty timeline */
  }

  return NextResponse.json({
    view_count: client.view_count ?? 0,
    first_viewed_at: client.first_viewed_at ?? null,
    last_viewed_at: client.last_viewed_at ?? null,
    views, // newest-first ISO timestamps
  });
}
