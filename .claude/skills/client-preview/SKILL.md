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

This is a **sales asset**. It has to feel hand-crafted for *that* business,
look gallery-grade, render perfectly offline and inside the sandboxed
`/raw/<token>` portal viewer, and be a single file that can't break. Go big —
it should clearly out-class whatever the prospect has now.

## Non-negotiable rules

1. **ONE page only.** A landing page. No second page, no router, no `/about`.
   Use in-page anchor sections (`#work`, `#contact`) — never separate documents.
2. **Self-contained.** Inline the CSS in `<style>` and JS in `<script>`. Prefer
   a single `index.html`; a small **`assets/` folder of the client's own
   downloaded images** is allowed (and encouraged — see Imagery). Reference them
   with **relative paths** (`assets/logo.png`). Embed icons/decorative art as
   inline `<svg>`/`data:` URIs. The only acceptable network request is a Google
   Fonts `<link>` (with a system fallback). No frameworks, no CDNs, no build.
3. **Relative paths only** if you ever split files — never root-absolute
   (`/styles.css`). A single inlined `index.html` is strongly preferred.
4. **Real, business-specific everything.** No lorem ipsum, no fabricated phone
   numbers, no fake testimonials/review counts/awards, no broken or random
   hotlinked photos (see "Imagery"). If you don't have a real fact, design
   around it — never invent it.
5. **Responsive + accessible + fast.** Mobile-first (360px → 1440px), honors
   `prefers-reduced-motion`, real `:focus-visible`, semantic landmarks, alt
   text, and it must stay smooth (no jank, no layout shift).
6. **Output is a folder with `index.html` at its root**, named the client slug
   (e.g. `weston-beauty/index.html`).

## 1 · Gather the brief

- **Business name, industry, city; vibe; what they sell; the real hook.**
- **Fetch their site / Instagram** and mine real services, product names, copy,
  and colors. If they have nothing online, that gap *is* the pitch.
- Never invent facts. Missing phone/address/testimonials → omit or use an honest
  placeholder treatment, don't fabricate.

## 2 · The bar: make it RICH (this is the upgrade — don't ship thin)

A preview must feel like a **complete, premium site**, not a hero + three cards.
Aim for ~7–10 well-crafted sections and several real interactions. Use judgment
on which fit the business, but clear this **minimum bar every time**:

### A. Content depth (≥ 7 sections)
Pull from, and tailor to the business:
- **Sticky, condensing nav** with anchor links + a primary CTA.
- **Immersive hero** — bold value prop, one primary CTA, a striking custom
  visual (see Visuals), and a small stat/credential row.
- **Value / why-them strip** — 3–4 differentiators.
- **Signature offering** — services/collection/menu as rich cards (tabbed or
  filterable if there are natural categories).
- **Gallery / results / showcase** — a visual section with a **lightbox** (use
  CSS/SVG art or the client's real media; never random stock that can 404).
- **Story / about** — short, specific narrative in their voice.
- **Process / how it works** — 3–4 numbered steps.
- **Social proof** — ONLY if real (testimonials/logos you actually found);
  otherwise a trust/standards/credentials block instead.
- **Pricing / packages** — indicative tiers when it fits the business (clearly
  framed as starting points), or an "enquire" block if pricing is bespoke.
- **FAQ** — an accordion answering the real objections for that trade.
- **Prominent booking/contact CTA**.
- **Extended footer** (never a one-liner): a multi-column footer with the
  brand/real logo + a short about line, quick links, shop/services, and a
  contact column (address, phone, hours) — plus a bottom bar with copyright.

### B. Interactivity & motion (several, tasteful, all reduced-motion-aware)
Ship a mix — see `reference/interactions.html` for copy-ready, self-contained
patterns:
- Scroll-reveal on sections; subtle hover lifts on cards/buttons.
- **Animated count-up** stats.
- At least **one signature interaction**: lightbox gallery, filter/tab switch,
  before/after slider, or a scroll-driven moment.
- **Accordion** FAQ.
- **Sticky header** that condenses on scroll + a working **mobile menu**.
- Optional: a thin scroll-progress bar, a sticky "Book" bar on mobile.
- Everything disabled/neutralized under `prefers-reduced-motion`.

### C. Conversion engineering
- A clear **primary CTA repeated** through the page (hero, mid, end) + a
  **sticky/﻿persistent book or call action**.
- An honest **value/offer block** (what they get, why now) — no fake urgency.
- **Trust signals** real to the trade (guarantees, certifications, "no
  obligation", reply-time) — never invented numbers.
- A real, **no-backend CTA** (form or call/booking link) with a graceful
  on-submit acknowledgement.

### D. Visual art direction (gallery-grade, custom per business)
- A bespoke **palette + type pairing** derived from the business (define as CSS
  custom properties; characterful display face + clean sans via Google Fonts
  with system fallback).
- An **immersive hero treatment** — layered gradients + grain, inline-SVG
  scene, bold type composition, or CSS art. Not a flat stock hero.
- **Custom inline-SVG iconography** drawn for their services (not emoji).
- **Section dividers, textures, depth** (soft shadows, gradient meshes) for a
  crafted, expensive feel. Consistent spacing scale and rhythm.

### E. Polish & motion craft — NON-NEGOTIABLE (it's a first impression)
The preview *is* the sales pitch. Every surface must look intentional and feel
alive. Hold this bar on every build:

- **Editorial section headers.** Each header = a small kicker rule/eyebrow (e.g.
  a fine accent line before an uppercase label) + a large, tight display
  heading + a one-line supporting "kicker" sentence. Consistent across sections.
- **Refined navbar — fixed.** Use `position: fixed` so it stays visible the
  whole scroll (give the hero enough top padding to clear it). It **condenses on
  scroll** (less padding + a hairline/shadow appear), links get an **animated
  underline**, a clear primary CTA, and a real mobile menu. Optional thin
  scroll-progress bar at the very top.
- **Cards with life.** Generous padding, soft radius, a **hover lift** plus a
  signature touch (e.g. a gradient accent line that draws across the top, image
  zoom, or border glow). Never flat, static boxes.
- **Choreographed motion.** Sections **reveal on scroll** with a gentle rise;
  **stagger** grouped items (cards/list) by ~60–90ms so they cascade, not pop in
  together. **Count-up** any stats. Buttons/links have smooth transitions. One
  signature interaction (lightbox / tabs / before-after / scroll moment).
- **Hero is a moment.** Layered gradient/grain or CSS/SVG art, big confident
  type, a clear CTA, a small credential/stat row — it has to land in 2 seconds.
- **Spacing & rhythm.** A consistent spacing scale and generous section padding
  (premium breathing room). Align everything to a grid; no cramped or random gaps.
- **Smooth, never janky.** 60fps; animate only transform/opacity; no layout
  shift; everything neutralizes cleanly under `prefers-reduced-motion`.

Treat anything flat, abrupt, or "default-looking" as a bug. If a section
wouldn't look at home on an award-gallery site, refine it before shipping.

### Imagery — use the client's REAL images (makes it personal)
First, try to use the business's **own** images so the preview feels like *them*:
- **Always grab their real logo / wordmark** if you can reach it, and feature it
  (nav and/or footer). It's the single biggest "this is really us" signal.
- Pull a few of their real photos (hero, gallery) when reachable. **Download
  them into the build's `assets/` folder and reference relatively** — never
  hotlink a remote URL (it can 404, get blocked, or change). Downloading keeps
  the preview self-contained and unbreakable.
- Many small-business sites are bot-protected or JS-rendered (403s, no images in
  raw HTML). Try a reader proxy / their CDN; if their photography genuinely
  can't be extracted, **don't fabricate or hotlink guessed URLs** — fall back to
  self-contained, intentional visuals (inline SVG, CSS gradients/patterns,
  brand-tone gallery tiles) that read as premium minimalism, and say so in the
  handoff. Real logo + tasteful CSS art beats broken/random stock every time.

### Typography — avoid the "AI default" look
Pick a **characterful, on-brand** pairing. **Avoid the over-defaulted fonts that
read as AI/template** — Inter, Roboto, Open Sans, Arial, Helvetica, or
system-font-only. Reach instead for type with personality (e.g. Fraunces,
Cormorant, Playfair, Marcellus for display; Hanken Grotesk, Mulish, Schibsted
Grotesk, Bricolage for body) chosen to fit the brand. Always include a system
fallback in the stack.

## 3 · Build

- Single inlined `index.html`. Use `reference/starter.html` for structure and
  `reference/interactions.html` for the interaction patterns — then heavily
  customize. Never ship either skeleton as-is.
- Write real copy in the business's voice; headline specific to them.

## 4 · QA before handoff

- Renders with **no console errors**, nothing broken, no `{{placeholders}}`, no
  root-absolute paths.
- Check **desktop + mobile (≤400px)**; confirm scroll-reveal, the signature
  interaction, accordion, sticky nav, and reduced-motion all behave.
- A headless screenshot of 2–3 sections is a good sanity check.

## 5 · Package + hand off to the portal

- Folder named the client slug; run `scripts/package.sh <folder>` for a clean
  `.zip`.
- Dashboard: **create client** → **upload** → toggle **preview ready** → copy
  the **access code** → prospect views it at `ges-gamma.vercel.app/login` (or
  `/preview/<slug>`). Deleting the client instantly revokes access.

## Anti-patterns (reject these)

- Thin pages (hero + a few cards and done) — clear the minimum bar above.
- Multi-page sites/routers; "click here for the about page."
- Template-y tells: rotated "FREE" stickers, fake testimonials/reviews/awards,
  stock-hero + 3-feature filler, lorem ipsum, emoji-as-icons.
- External scripts/CDNs (beyond Google Fonts), hotlinked images that 404,
  root-absolute paths, anything that janks or shifts layout.
- Anything that looks auto-generated. It should look like GES hand-built it.
