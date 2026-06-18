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
2. **Self-contained `index.html`.** Inline the CSS in `<style>` and JS in
   `<script>`; embed the logo/icons/art as inline `<svg>` or `data:` URIs. The
   only acceptable external request is a Google Fonts `<link>` — and it must
   degrade to a system font stack if offline. No frameworks, no CDNs, no build.
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
- **Prominent booking/contact CTA** + footer with hours/location if known.

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

### Imagery (don't break, don't look AI)
Prefer **self-contained, intentional visuals** — inline SVG illustrations, CSS
gradients/patterns, bold type, product/gallery cards with brand-tone gradients.
These always render and look designed. Only use photos from a source the client
controls; otherwise design around their absence as premium minimalism.

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
