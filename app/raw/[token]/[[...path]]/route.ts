import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/session";
import { findClientBySlug } from "@/lib/clients";
import { getSupabaseAdmin, PREVIEW_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

// Serves a client's uploaded static build, gated by a short-lived token.
// Loaded inside an <iframe> by /preview/[business] so the address bar stays clean.
//
// Builds are served under the dynamic prefix /raw/<token>/. To make arbitrary
// builds (plain one-pagers, Vite dist/, Next out/) render *fully* we:
//   1. inject <base href="/raw/<token>/"> so relative URLs resolve, and
//   2. rewrite root-absolute URLs (src/href/poster/srcset, CSS url()/@import)
//      to the same prefix, since <base> alone doesn't affect "/..." URLs, and
//   3. fall back to index.html for extensionless paths so SPA client-side
//      routing survives a deep link or refresh.

const MIME: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  mp4: "video/mp4",
  webm: "video/webm",
  txt: "text/plain; charset=utf-8",
  wasm: "application/wasm",
};

const extOf = (p: string) => p.split(".").pop()?.toLowerCase() ?? "";
const hasExt = (p: string) => /\.[a-z0-9]+$/i.test(p);

/** Rewrite root-absolute url()/@import in CSS (and inline styles) to the prefix. */
function rewriteCss(css: string, base: string): string {
  return css
    .replace(/url\(\s*(['"]?)\/(?!\/)/gi, (_m, q) => `url(${q}${base}`)
    .replace(/@import\s+(['"])\/(?!\/)/gi, (_m, q) => `@import ${q}${base}`);
}

/** Inject <base> and rewrite root-absolute URLs so any static build resolves. */
function rewriteHtml(html: string, base: string): string {
  let out = html;
  // 1) root-absolute attribute URLs (skip protocol-relative "//")
  out = out.replace(/(\s(?:src|href|poster)\s*=\s*["'])\/(?!\/)/gi, (_m, p) => `${p}${base}`);
  // 2) srcset (comma-separated "url descriptor" pairs)
  out = out.replace(/(\ssrcset\s*=\s*["'])([^"']*)(["'])/gi, (_m, pre, val, post) =>
    `${pre}${(val as string).replace(/(^|,\s*)\/(?!\/)/g, (_x, sep) => `${sep}${base}`)}${post}`
  );
  // 3) url()/@import inside inline styles + <style> blocks
  out = rewriteCss(out, base);
  // 4) <base> for relative URLs — injected LAST so its own root-absolute href
  //    (it starts with "/raw/…") isn't re-prefixed by the rewrite in step 1.
  if (/<head[^>]*>/i.test(out)) out = out.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
  else out = `<base href="${base}">` + out;
  return out;
}

function shell(title: string, inner: string, status = 200): NextResponse {
  // Matches the portal's glass look (acid-edged frosted card on near-black with
  // a faint masked grid + ambient glow) so these in-iframe states feel branded.
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/>
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0}html,body{height:100%}
  body{position:relative;background:#070707;color:#fff;font-family:ui-monospace,Menlo,Consolas,monospace;display:grid;place-items:center;padding:24px;text-align:center;overflow:hidden}
  body::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(204,255,0,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(204,255,0,.05) 1px,transparent 1px);background-size:38px 38px;-webkit-mask-image:radial-gradient(ellipse 80% 80% at 50% 40%,#000 30%,transparent 75%);mask-image:radial-gradient(ellipse 80% 80% at 50% 40%,#000 30%,transparent 75%)}
  body::after{content:"";position:absolute;top:18%;left:30%;width:340px;height:340px;background:rgba(204,255,0,.07);border-radius:50%;filter:blur(64px);pointer-events:none}
  .box{position:relative;z-index:1;background:rgba(255,255,255,.04);backdrop-filter:blur(22px) saturate(135%);-webkit-backdrop-filter:blur(22px) saturate(135%);border:1px solid rgba(204,255,0,.14);border-radius:24px;box-shadow:0 24px 70px -24px rgba(0,0,0,.82);padding:46px 36px;max-width:560px;animation:in .5s ease-out both}
  @keyframes in{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
  .tag{display:inline-block;background:rgba(204,255,0,.1);color:rgba(204,255,0,.9);border:1px solid rgba(204,255,0,.25);border-radius:999px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;font-size:10px;padding:6px 12px;margin-bottom:22px}
  h1{font-size:clamp(1.4rem,5vw,2.1rem);line-height:1.14;letter-spacing:-.01em;margin-bottom:14px;font-family:system-ui,-apple-system,sans-serif;font-weight:800}
  p{color:#9a9a9a;font-size:14px;line-height:1.65}a{color:#ccff00;text-decoration:none;border-bottom:1px solid rgba(204,255,0,.5)}a:hover{border-bottom-color:#ccff00}
  @media (prefers-reduced-motion:reduce){.box{animation:none}}
</style></head><body><div class="box">${inner}</div></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

const notFinishedPage = () =>
  shell(
    "Preview in progress — GES",
    `<span class="tag">GES Client Preview</span>
     <h1>Preview is not finished —<br/>check back in a day.</h1>
     <p>We're still building your site. You'll be able to view it right here with the same code shortly.<br/><br/>Questions? <a href="/#contact">Contact us</a>.</p>`
  );

const expiredPage = () =>
  shell(
    "Session expired — GES",
    `<span class="tag">GES Client Preview</span>
     <h1>Session expired</h1>
     <p>Please re-enter your access code to view the preview again.</p>
     <script>if(window.top&&window.top!==window.self){window.top.location.reload()}</script>`,
    401
  );

function htmlResponse(html: string, token: string): NextResponse {
  return new NextResponse(rewriteHtml(html, `/raw/${token}/`), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string; path?: string[] }> }
) {
  const { token, path } = await ctx.params;

  const payload = verifyToken(token, "preview");
  if (!payload) return expiredPage();

  const slug = payload.sub;
  const client = await findClientBySlug(slug);
  if (!client || client.status !== "active") return expiredPage();
  if (!client.preview_ready) return notFinishedPage();

  const rel = (path && path.length ? path.join("/") : "index.html").replace(/^\/+/, "");
  if (rel.includes("..")) return new NextResponse("Not found", { status: 404 });

  const admin = getSupabaseAdmin();
  let dl = await admin.storage.from(PREVIEW_BUCKET).download(`${slug}/${rel}`);

  // SPA fallback: an extensionless path (a client-side route) that isn't a real
  // file should serve index.html so refresh/deep-links keep working.
  if ((dl.error || !dl.data) && !hasExt(rel)) {
    dl = await admin.storage.from(PREVIEW_BUCKET).download(`${slug}/index.html`);
    if (dl.data) return htmlResponse(await dl.data.text(), token);
  }

  if (dl.error || !dl.data) {
    if (rel === "index.html") return notFinishedPage();
    return new NextResponse("Not found", { status: 404 });
  }

  const data = dl.data;
  const ext = extOf(rel);

  if (ext === "html" || ext === "htm") return htmlResponse(await data.text(), token);

  if (ext === "css") {
    return new NextResponse(rewriteCss(await data.text(), `/raw/${token}/`), {
      status: 200,
      headers: { "content-type": "text/css; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
    });
  }

  const buf = Buffer.from(await data.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "content-type": MIME[ext] ?? data.type ?? "application/octet-stream",
      "cache-control": "private, max-age=300",
      "x-robots-tag": "noindex",
    },
  });
}
