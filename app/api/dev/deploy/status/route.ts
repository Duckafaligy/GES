import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { vercelGetDeployment } from "@/lib/vercel";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

// Polled by the dashboard. When the build is READY, save the live URL on the client.
export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") ?? "";
    const slug = searchParams.get("slug") ?? "";
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

    const { readyState, url } = await vercelGetDeployment(id);
    const fullUrl = url ? `https://${url}` : null;

    if (readyState === "READY" && slug && fullUrl) {
      await getSupabaseAdmin()
        .from("clients")
        .update({ deploy_url: fullUrl, preview_ready: true })
        .eq("slug", slug);
    }
    return NextResponse.json({ readyState, url: fullUrl });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
