---
name: client-preview
description: >-
  Build an immersive, fully custom SINGLE-PAGE landing-page preview/demo for a
  prospective client, packaged to drop straight into the GES client portal. Use
  whenever asked to make a website preview, demo, mockup, or "what their site
  could look like" for a business (e.g. "make a preview for <business>", "build
  a demo landing page for <client>"). Produces ONE self-contained landing page —
  never a multi-page site.
---

# GES Client Preview Builder

Build a prospect **one** immersive, custom landing page that makes them go "wow —
I want that," then hand it off ready to upload to the GES client portal
(`/Developer-Dashboard-Page` → create client → upload → share access code).

This is a **sales asset**, not a finished product. It has to feel hand-crafted
for *that* business, render perfectly offline and inside the sandboxed
`/raw/<token>` portal viewer, and be a single file that can't break.

## Non-negotiable rules

1. **ONE page only.** A landing page. No second page, no router, no `/about`.
   Use in-page anchor sections (`#work`, `#contact`) — never separate documents.
2. **Self-contained `index.html`.** Inline the CSS in `<style>` and JS in
   `<script>`; embed the logo/icons as inline `<svg>` or `data:` URIs. The only
   acceptable external request is a Google Fonts `<link>` — and it must degrade
   to a system font stack if offline.
3. **Relative paths only** (`styles.css`, `assets/x.svg`) if you split files —
   never root-absolute (`/styles.css`). Root-absolute breaks when the file is
   opened directly and complicates the portal rewriter. (A single inlined
   `index.html` sidesteps this entirely — prefer it.)
4. **No placeholders, no lorem ipsum, no broken images.** Every word is real,
   business-specific copy. Don't hotlink random photos that may 404 — see
   "Imagery" below.
5. **Responsive + accessible.** Mobile-first, works at 360px → 1440px, honors
   `prefers-reduced-motion`, real `:focus-visible`, semantic landmarks, alt text.
6. **Output is a folder with `index.html` at its root** (the portal uploader
   walks a build folder). Name it the client slug, e.g. `lumen-coffee/index.html`.

## 1 · Gather the brief

Pull together (ask only for what you can't infer):

- **Business name, industry, city.**
- **Vibe / brand personality** (e.g. warm artisan, sleek luxury, bold DTC).
- **What they sell** + the 3–5 things worth showcasing.
- **A real hook** — why customers choose them.
- **Existing site / Instagram** (if any) — mine it for real copy, product names,
  and colors. If they have nothing online, that's the pitch: you're giving them
  a presence they don't have.

If the business is real and reachable, fetch their site/socials for authentic
details. Never invent fake awards, fake review counts, or fake addresses.

## 2 · Design playbook (make it immersive + custom)

Each preview must look **different** — pull the palette, type, and mood from the
business, not a fixed template. Aim for the bar of the GES site itself.

- **Brand-fit palette:** 1 ink/base, 1 paper/light, 1–2 accents drawn from the
  business (a roaster = warm browns; a florist = soft botanicals; a brewery =
  bold industrial). Define them as CSS custom properties.
- **Type with personality:** pair a characterful display face with a clean sans
  (Google Fonts, with a `system-ui` fallback). Big, confident headings.
- **A hero that lands in 2 seconds:** clear value proposition, one primary CTA,
  a striking visual treatment (gradient + grain, CSS-art, inline SVG scene, or a
  bold type composition). No generic stock-hero clichés.
- **Sections that fit the business** (pick what's relevant): hero → signature
  offering / collection → why-them / story → social proof or process →
  prominent CTA (book / order / enquire) → footer. ~4–6 sections, tight.
- **Tasteful motion only:** scroll-reveal on sections (IntersectionObserver),
  subtle hover lifts, maybe one signature interaction. Never gimmicky. All of it
  disabled under `prefers-reduced-motion`.
- **Conversion built in:** a real CTA (book a call, order online, request a
  quote) wired to a no-backend acknowledgement, plus visible phone/email.

### Imagery (don't break, don't look AI)

Prefer **self-contained, intentional visuals** over hotlinked photos:
inline SVG illustrations, CSS gradients/patterns, bold type, product "cards"
with brand-tone gradients. These always render and look designed. If you truly
need photos, only use a stable source the client controls; otherwise design
around their absence — it reads as premium minimalism, not a missing asset.

## 3 · Build

- Default to a **single inlined `index.html`** (most robust for the portal +
  offline). Use `reference/starter.html` as the structural skeleton — then
  heavily customize; do not ship the skeleton as-is.
- Write real copy in the business's voice. Make the headline specific to them.
- Keep it lean: one file, no build step, no framework.

## 4 · QA before handoff

- Open it and check it renders with **no console errors** and **nothing broken**.
- Verify mobile (≤400px) and desktop, and that scroll-reveal + reduced-motion work.
- Confirm there are **no remaining `{{placeholders}}`** and no `/root-absolute`
  asset paths.
- A quick headless screenshot is a good sanity check (Playwright,
  `ignoreHTTPSErrors: true` if hitting the live portal).

## 5 · Package + hand off to the portal

- Put the file(s) in a folder named the client slug; run
  `scripts/package.sh <folder>` to produce a clean `.zip` for upload (and so it
  imports easily on iPad/desktop).
- In the GES dashboard: **create the client** (generates the 64-char access
  code + slug) → **upload** the folder → toggle **preview ready** → copy the
  **access code**.
- The prospect views it at `ges-gamma.vercel.app/login` (or
  `/preview/<slug>`) with that code. Deleting the client instantly revokes it.

## Anti-patterns (reject these)

- Multi-page sites, routers, or "click here for the about page."
- Template-y tells: rotated "FREE" stickers, fake testimonials, stock-hero +
  three-feature-cards filler, lorem ipsum, emoji-as-icons everywhere.
- External scripts/CDNs (beyond Google Fonts), hotlinked images that can 404,
  root-absolute asset paths.
- Anything that looks auto-generated. It should look like GES hand-built it.
