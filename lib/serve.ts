// Shared helpers for serving an arbitrary static build through a gated route.
// Used by the template-demo route (the client /raw route keeps its own copy).

export const MIME: Record<string, string> = {
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

export const extOf = (p: string) => p.split(".").pop()?.toLowerCase() ?? "";
export const hasExt = (p: string) => /\.[a-z0-9]+$/i.test(p);

/** Rewrite root-absolute url()/@import in CSS to the gated prefix. */
export function rewriteCss(css: string, base: string): string {
  return css
    .replace(/url\(\s*(['"]?)\/(?!\/)/gi, (_m, q) => `url(${q}${base}`)
    .replace(/@import\s+(['"])\/(?!\/)/gi, (_m, q) => `@import ${q}${base}`);
}

/** Inject <base> and rewrite root-absolute URLs so any static build resolves. */
export function rewriteHtml(html: string, base: string): string {
  let out = html;
  if (/<head[^>]*>/i.test(out)) out = out.replace(/<head([^>]*)>/i, `<head$1><base href="${base}">`);
  else out = `<base href="${base}">` + out;
  out = out.replace(/(\s(?:src|href|poster)\s*=\s*["'])\/(?!\/)/gi, (_m, p) => `${p}${base}`);
  out = out.replace(/(\ssrcset\s*=\s*["'])([^"']*)(["'])/gi, (_m, pre, val, post) =>
    `${pre}${(val as string).replace(/(^|,\s*)\/(?!\/)/g, (_x, sep) => `${sep}${base}`)}${post}`
  );
  out = rewriteCss(out, base);
  return out;
}

export const noStoreHtml = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex",
};
