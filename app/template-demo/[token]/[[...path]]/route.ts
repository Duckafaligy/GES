import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/session";
import { getTemplateBySlug, TEMPLATE_BUCKET } from "@/lib/templates";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MIME, extOf, hasExt, rewriteHtml, rewriteCss, noStoreHtml } from "@/lib/serve";

export const runtime = "nodejs";

// Email-gated live demo for an uploaded template build (templates/<slug>/demo/...).
// Token (purpose "demo") is minted by /api/demo after the visitor enters their email.
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string; path?: string[] }> }
) {
  const { token, path } = await ctx.params;

  const payload = verifyToken(token, "demo");
  if (!payload) return new NextResponse("Demo link expired — request it again.", { status: 401 });

  const slug = payload.sub;
  const found = await getTemplateBySlug(slug);
  if (!found || !found.template.demo_ready) return new NextResponse("Demo not available.", { status: 404 });

  const rel = (path && path.length ? path.join("/") : "index.html").replace(/^\/+/, "");
  if (rel.includes("..")) return new NextResponse("Not found", { status: 404 });

  const base = `/template-demo/${token}/`;
  const admin = getSupabaseAdmin();
  let dl = await admin.storage.from(TEMPLATE_BUCKET).download(`${slug}/demo/${rel}`);

  if ((dl.error || !dl.data) && !hasExt(rel)) {
    dl = await admin.storage.from(TEMPLATE_BUCKET).download(`${slug}/demo/index.html`);
    if (dl.data) return new NextResponse(rewriteHtml(await dl.data.text(), base), { headers: noStoreHtml });
  }
  if (dl.error || !dl.data) return new NextResponse("Not found", { status: 404 });

  const data = dl.data;
  const ext = extOf(rel);
  if (ext === "html" || ext === "htm") return new NextResponse(rewriteHtml(await data.text(), base), { headers: noStoreHtml });
  if (ext === "css") {
    return new NextResponse(rewriteCss(await data.text(), base), {
      status: 200,
      headers: { "content-type": "text/css; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
    });
  }

  const buf = Buffer.from(await data.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: { "content-type": MIME[ext] ?? data.type ?? "application/octet-stream", "cache-control": "private, max-age=120", "x-robots-tag": "noindex" },
  });
}
