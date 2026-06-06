# GES — Global E-Commerce Saviours

Marketing / portfolio site for **GES**, a studio that builds conversion-first
e-commerce websites, lifelike 3D product experiences, and the AI agents &
automation that run the business behind the storefront. The site itself is the
pitch: a dark, brutalist landing page with a full-bleed hero video, a
scroll-driven bike "explode" showcase, an interactive 360° product viewer, and a
password-gated client portal that serves per-client preview builds.

> **Project root:** `C:\GES` — this folder *is* the Next.js app. (It was
> previously nested under `C:\GES\live`; that nesting has been flattened.) The
> rejected first build is archived in `OLD/`, is **git-ignored**, and must never
> be ported from.

---

## Tech stack

| Concern        | Choice                                             |
| -------------- | -------------------------------------------------- |
| Framework      | Next.js 16.2.7 (App Router) + Turbopack            |
| UI runtime     | React 19                                           |
| Styling        | Tailwind CSS v4 (CSS-first, configured in `app/globals.css` — no `tailwind.config`) |
| Animation      | Framer Motion v12                                  |
| Icons          | lucide-react                                       |
| Media tooling  | `ffmpeg-static` + `ffprobe-static` (bundled binaries, for frame extraction) |
| Language       | TypeScript 5                                        |

## Getting started

```bash
npm install      # first time only
npm run dev      # http://localhost:3000  (Turbopack)
npm run build    # production build  — do NOT run while `npm run dev` is live
npm run start    # serve the production build
npm run lint
```

> **Cache caveat:** running `npm run build` against a live `next dev` server can
> corrupt Turbopack's `.next` incremental cache and make the browser serve stale
> compiled code. If that happens: stop the dev server, delete `.next`, restart
> `npm run dev` clean.

## Project structure

```
app/
  layout.tsx          Root layout + fonts + global metadata
  page.tsx            Landing page — composes the sections below in order
  globals.css         Tailwind v4 theme: design tokens, section themes, brutalist + portal primitives
  login/              Client portal login route (SHA-256 gate)
  preview/            Per-client preview build viewer
  api/                Route handlers (server-side endpoints)
components/
  Navigation.tsx      Sticky top nav + marquee ticker + Client Portal link
  VideoHero.tsx       Full-bleed background hero video with a self-learning seamless loop
  BikeShowcase.tsx    Scroll-scrubbed 192-frame bike "explode" with part callouts
  ThreeDFeatures.tsx  "Products That Feel Real Online" — 3 capability tabs (one with a live viewer)
  ProductViewer.tsx   Interactive 360° turntable viewer (swipe left/right to rotate)
  Services.tsx        Services grid (E-Commerce · 3D · Agents/Workflows/Automation)
  Pricing.tsx         Pricing (kept understated — framed as an advantage)
  Process.tsx         Process / how-we-work timeline
  Stats.tsx           Headline stats band
  Contact.tsx         Contact / book-a-call section
  Footer.tsx          Footer
lib/clients.ts        Client lookup helpers for the portal
data/clients.json     Client records (slugs, display names, SHA-256 hashed passcodes — no plaintext)
scripts/generate-hash.js   Helper to mint a SHA-256 hash for a new client passcode
public/
  bike-frames/        192 × frame-0001.webp … frame-0192.webp (2200×1238, exactly 16:9)
  media/              premium-360.mp4 (desk turntable), standard-360.mp4 (legacy), watch-hero.mp4
GES_Services.md       Business / sales plan: services, pipeline, pricing models
```

## Key implementation notes

### Hero video (`VideoHero.tsx`)
Full-bleed background `<video>` (`object-cover`) under a dark gradient scrim.
Many product clips hold on their final frame for ~1s before looping, which reads
as a dead pause. The component **learns** where that trailing freeze begins — on
the first pass it samples tiny frames onto a 32×18 offscreen canvas and detects
when motion stops in the back half of the clip — then on every subsequent loop it
restarts a few frames *before* that point, so there's no visible seam.

### Bike showcase (`BikeShowcase.tsx`)
A 600vh section with a sticky full-screen `<canvas>`. Scroll progress maps to a
frame index across the 192 preloaded WebP frames, drawn each tick. The scrub
**completes early** (at `SCRUB_END = 0.66`) and then HOLDS on the final frame for
the rest of the scroll, so the fully-exploded, labelled bike stays readable
before the section releases.

- **Backdrop matches the footage.** The exploded render is composited on flat
  black, so the section, the canvas clear colour, and the letterbox bars are all
  the exact same `#000000` (`BG`). There is **no edge-bleed / edge-stretch** —
  the earlier "stretched colours" down the sides came from stretching the frame's
  edge row/column into the bars and has been removed. The bars now read as a
  seamless continuation of the render.
- **Contain, not cover.** `FILL_SCALE = 1.0` and a contain fit keep the *whole*
  composed frame on screen (no zoom-in, no chopped wheels) so the
  percentage-positioned part labels stay mapped at any viewport ratio.
- **Readable callouts.** Each `PARTS[]` label is an acid-bordered (`#ccff00`)
  black chip with white 11px mono text and a dark offset shadow; opacity
  **snaps to full** just before the bike settles, so labels are solid and legible
  against the black void rather than faint ghosts.

### 360° product viewer (`ProductViewer.tsx`)
Turntable-style viewer backed by a short rotation video instead of extracted
frames (no build-time tooling required). Interaction is deliberately **one
thing — a horizontal swipe/drag** that scrubs the video's `currentTime`
(wrap-around) to rotate the product. Pinch, wheel-zoom, pan and double-tap were
intentionally removed; vertical gestures fall through to normal page scroll
(`touch-action: pan-y`). When untouched it idle-spins (muted loop) for a "live"
feel, then resumes after a short idle.

Seeks are **chained** — only one seek is ever in flight, and the moment it lands
the viewer jumps straight to the newest target. This stops heavier clips (e.g.
the ~6 MB `premium-360.mp4`) from piling up pending seeks, which is what
previously made the premium tier feel laggy.

It is rendered **detached on the right-hand side** of the Premium tab (not inside
the text card) and is currently wired to the **Premium 3D Model** tier only.

### 3D & automation tabs (`ThreeDFeatures.tsx`)
Section 04. Three capability tabs (the old "Standard 3D" tier was removed):

1. **Premium 3D Model** — hyper-realistic, lifelike, 360° interactive. The only
   tab with a `video`, so it shows the live `ProductViewer` (desk turntable) on
   the right; drag to spin a full 360°.
2. **Landing Scroll Animation** — the scroll-driven, frame-by-frame explode build
   (what the bike showcase demonstrates).
3. **Workflows · Agents · Automation** — custom AI agents and automated workflows
   that run the work behind the storefront.

Tabs without a `video` (2 & 3) render a "What You Get" capability stack on the
right instead of the viewer.

### Client portal (`app/login`, `app/preview`, `lib/clients.ts`, `data/clients.json`)
Clients enter a passcode; it's hashed with **SHA-256** and compared against the
stored hash in `data/clients.json` (no plaintext passcodes are stored or
committed). On match, the matching preview build is shown. Use
`node scripts/generate-hash.js` to mint the hash for a new client.

## Design system

Defined as CSS custom properties and utilities in `app/globals.css`.

- **Primary accent — `--acid` (`#ccff00`, lime green).** The brand pop, used
  deliberately: the GES logo / wordmark, text highlights, active tab fills, and
  small UI ticks. Green is the favourite, so it stays the hero.
- **Secondary accent — Warm Amber (`--amber` `#e0a11e`, `--amber-deep`
  `#c4880f`).** Added to make the palette feel more premium without breaking the
  minimalist black/white/lime base. Used *sparingly* for warmth: section eyebrow
  accents (Services, 3D & Automation, Stats) and the stat index ticks. Use
  `--amber` on dark sections and `--amber-deep` on light/bone sections (better
  contrast).
- **Section theme contexts.** Each `<section>` picks one of `.sec-light`,
  `.sec-bone`, `.sec-dark`, `.sec-acid`. Children read `--fg` / `--bg` / `--line`
  / `--muted`, so the same brutalist primitives invert automatically per block.
- **Brutalist primitives.** `.hard` / `.hard-sm` / `.hard-lg` (hard border +
  offset shadow), `.lift` (hover translate), `.btn-brut` / `.btn-ghost`
  (monochrome, invert per section — green is reserved for branding, not buttons),
  `.eyebrow` / `.mono` / `.display`, `.grid-lines`, marquee + entry animations.
- **Portal / glass system.** A deliberately separate soft, dark, frosted look
  (`.glass`, `.btn-primary`, ambient blobs) used only by the client login +
  preview, so the private client area feels premium while the public landing
  stays hard-edged.

## Conventions

- `OLD/` is a **rejected** build kept only as an archive — it is git-ignored,
  never imported from, and never ported.
- Keep pricing understated across the marketing sections; surface concrete
  numbers inside the per-client portal rather than on the public page.
- Green (`--acid`) = branding/highlights only. Amber = sparse warmth accents.

## Recent changes (latest session)

- **Bike showcase:** removed the edge-bleed letterbox (the "stretched colours"
  on the X/Y bars); section + canvas + bars are now one flat `#000000` matching
  the render. Rewrote part labels for legibility (acid border, white 11px text,
  snap-to-full opacity).
- **Section 04 (3D):** dropped the **Standard 3D** tier; tabs are now
  **Premium 3D Model**, **Landing Scroll Animation**, and
  **Workflows · Agents · Automation**. The Premium 360° viewer was moved out of
  the text box to a **detached right-side** panel and limited to swipe-to-rotate.
- **ProductViewer:** rewritten to **swipe-only** (removed pinch/zoom/pan/wheel)
  with **seek-chaining** to kill the premium-clip lag.
- **Services:** removed **Local Business Websites**; section is now
  **E-Commerce Websites** (primary focus), **3D Product Experiences**, and
  **Agents, Workflows & Automation**.
- **Colour theme:** introduced the secondary **Warm Amber** accent (used sparingly
  on eyebrows + stat ticks) while keeping lime `--acid` as the hero.
