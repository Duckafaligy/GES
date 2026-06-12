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
| DB & Storage   | Supabase (Postgres `clients` table + private `client-previews` bucket) |
| Auth tokens    | HMAC-signed, short-lived, held in `sessionStorage` (no cookies) |
| Media tooling  | `ffmpeg-static` + `ffprobe-static` (bundled binaries, for frame extraction) |
| Language       | TypeScript 5                                        |
| Hosting        | Vercel (GitHub-deployed), domains via Cloudflare   |

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
  login/              Generic portal entry (code → redirect to /preview/<business>)
  preview/[business]/ Per-client preview — clean URL, code entered on the page
  raw/[token]/        Gated static file server (build streamed into the preview iframe)
  api/                Route handlers (server-side endpoints)
  (site)/             Route group: standalone content pages (footer Services + Legal links); its layout renders a solid nav + the footer
    services/{local-business-sites,e-commerce-websites,3d-product-models}/
    privacy-policy/ , terms-of-service/ , faq/ (blog-style FAQ hub)
components/
  Navigation.tsx      Sticky top nav + marquee ticker; `forceSolid` mode for light pages + logo routes to the first section
  VideoHero.tsx       Full-bleed background hero video with a self-learning seamless loop
  BikeShowcase.tsx    Scroll-scrubbed 192-frame bike "explode" with part callouts
  ThreeDFeatures.tsx  "Products That Feel Real Online" — 3 capability tabs (one with a live viewer)
  ProductViewer.tsx   Interactive 360° turntable viewer (swipe left/right to rotate)
  Services.tsx        Services grid (E-Commerce · 3D · Agents/Workflows/Automation)
  Pricing.tsx         Pricing (kept understated — framed as an advantage)
  Process.tsx         Process / how-we-work timeline
  Work.tsx            Selected Work (CLIME demo + OTDP live) — status pills, est. build value + price breakdown
  Contact.tsx         Contact + "Book a discovery call" trigger
  CustomCursor.tsx    Signature acid cursor ring (desktop fine-pointer only; off for touch + reduced-motion)
  BookCall.tsx        Branded booking flow (email-verify → month calendar → details → confirm). Modal on the `ges:book` event, AND `<BookCall inline />` renders it as a section above the footer
  MonthCalendar.tsx   Calendly-style month grid (shared by the booking flow + the manage page)
  ScrollProgress.tsx  Spring scroll-progress bar (bottom edge)
  Footer.tsx          Footer — wordmark + working link columns (Services / Company / Legal)
  ServiceDetail.tsx   Data-driven layout for the 3 service pages (hero · features · deliverables · CTA)
  LegalDoc.tsx        Data-driven layout for the legal pages (Privacy Policy, Terms of Service)
  FaqDoc.tsx          Data-driven, accordion FAQ page (the /faq "resources" hub)
lib/clients.ts        Client model + lookup (by code / by slug) + view tracking
lib/booking.ts        Shared booking slots/date helpers (used by the modal AND the API)
lib/supabase.ts       Server-only Supabase service-role client (lazy)
lib/session.ts        HMAC-signed, short-lived access tokens (no cookies)
lib/devAuth.ts        Bearer-token guard for the developer dashboard
app/api/verify-code/  Access code → short-lived preview token (+ logs the view)
app/api/preview-meta/ Public, non-sensitive gate personalization (business name + ready, by slug)
app/api/book/         Public: GET taken slots · POST a booking · manage/ (cancel/reschedule by token)
app/booking/[token]/  Self-serve manage page — reschedule or cancel from the email link
app/api/dev/          Dashboard auth + client CRUD + uploads + preview-token + zip download + analytics + bookings (Bearer-gated)
app/Developer-Dashboard-Page/   Password-gated dashboard (bookings, clients, per-client preview/upload/analytics)
supabase/schema.sql   Full DB schema (clients + client_views + bookings) + private storage bucket
lib/settings.ts       Booking availability settings (read/write, defaults if unmigrated)
app/api/availability/ Public: bookable days + time slots for the modal
supabase/migrations/  Incremental SQL for existing DBs (v2-analytics-and-codes, v3-bookings, v4-availability, v5-signups, v6-booking-manage)
scripts/add-client.mjs     CLI: add/update a client in Supabase
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

### Client portal (`app/preview/[business]`, `app/raw/[token]`, `app/login`, `app/Developer-Dashboard-Page`)
Each client preview lives at a clean URL: **`/preview/<business>`** (the slug is
auto-derived from the business name). The visitor enters their access code **on that
page** (or via `/login`); it's **SHA-256** hashed and matched against
`clients.code_hash` in **Supabase Postgres**. On match the server returns a
**short-lived (2h) HMAC-signed token** — **no cookie is set**; the token is held in
`sessionStorage` only and **never appears in the URL**.

The preview page then loads the build inside an `<iframe>` pointed at the internal
**`/raw/<token>/…`** route, which validates the token and **streams the client's
built site** from the private Supabase Storage bucket `client-previews/<slug>/`. To
make any build render *fully* under that dynamic path it injects a `<base>` tag **and**
rewrites root-absolute URLs (`src`/`href`/`poster`/`srcset`, CSS `url()`/`@import`)
to the gated prefix, and falls back to `index.html` for extensionless routes so SPA
client-side routing survives a refresh. New browser session → token gone → the code
must be re-entered. If a build isn't uploaded/ready, the page shows "Preview is not
finished — check back in a day."

Manage it all from the **developer dashboard** at `/Developer-Dashboard-Page`
(gated by **`DEV_DASHBOARD_PASSWORD` + `DEV_DASHBOARD_DOB`** — both a password and
a date of birth are required; the dev token lives in `sessionStorage`, never a
cookie). Adding a client takes just the **business name** (plus an optional
**custom slug** — leave it blank to auto-derive the slug from the name, e.g.
`Blooms & Co.` → `blooms-co`, auto-suffixed on collision). It **auto-generates a
64-character access code** (A–Z a–z 0–9); the plaintext is shown once in a copy
dialog **and stored on the client row (`access_code`)** so you can recover it
later from the per-client panel — use **New code** on a client to rotate it.
**Upload a built site folder** by drag-drop (or picker) — the importer skips
`node_modules` / `.git` / `.next`, requires an `index.html`, and pushes only web
files to Storage, then marks the preview ready. **Re-uploading replaces** the
previous build (old files are cleared first). Files over ~4 MB are flagged (Vercel's per-request upload limit) —
compress large media or host it elsewhere.

**Setup:** create a Supabase project, run `supabase/schema.sql` in its SQL editor
(creates the `clients` + `client_views` + `bookings` tables and the private
`client-previews` bucket; an existing DB instead runs the migrations under
`supabase/migrations/`),
then copy `.env.example` to `.env.local` and fill in all five values
(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`,
`DEV_DASHBOARD_PASSWORD`, `DEV_DASHBOARD_DOB`). For the Vercel deployment set those
**same five** under Project → Settings → Environment Variables. Add clients in the
dashboard (recommended) or via
`node --env-file=.env.local scripts/add-client.mjs "Business Name"` — the script
prints the generated access code.

**Upload only the build output**, never the project source: plain HTML as-is,
Vite/React → `dist/`, Next.js → `output: 'export'` then `out/`. A site that needs
a running server can't be static-hosted here — store a link to its real deployment
instead.

> **Next.js export caveat.** A Next `out/` renders, but its client-side router
> builds absolute `/_next/…` URLs at runtime that can't be rewritten server-side.
> For full in-preview navigation, build it with a matching `basePath`/`assetPrefix`,
> or prefer a plain one-pager / Vite build for previews.

### Footer links & standalone pages (`app/(site)`, `Footer.tsx`)
Every footer link resolves to real content. **Services** and **Legal** links
open dedicated pages under the `app/(site)` route group, which shares one
`layout.tsx` — a `forceSolid` `<Navigation>` (so the bar reads on light
backgrounds) plus the `<Footer>`. The three service pages render from a single
data-driven `ServiceDetail` component and the two legal pages from `LegalDoc`,
so adding another is just a block of data. **Company** links point at the
existing home anchors (`/#ownership`, `/#process`) and the client portal. The
nav logo points home; when you are already on `/` it smooth-scrolls back to the
first section instead of being a no-op.

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

## Recent changes

### v0.9.0 — Selected Work, FAQ hub, landing polish
- **Selected Work section.** Two real builds front-and-center: **CLIME**
  (labelled a full **website demo** — an example, not a live org) and **OTDP**
  (a **live, real organization**). Each card shows a status pill, an **est. build
  value** (CLIME ~$2,200, OTDP ~$1,400) and a small **price breakdown** with
  dotted leaders, noted as indicative — exact quote comes on the call. The
  Process timeline now sits **below** the examples.
- **FAQ "resources" hub (`/faq`).** Instead of an inline accordion, FAQs live on
  their own blog-style page (`FaqDoc.tsx`): dark glow header, light body,
  animated accordion categories (Pricing, Ownership buy-out vs rent, Process,
  3D/Tech, Working Together) and a CTA back to booking. Linked from the footer.
- **No public quote builder — on purpose.** We surface price ranges on the demo
  cards and talk specifics on the call; a public pricing/quote tool was
  deliberately left out so it doesn't anchor or deter bookings.
- **Landing micro-interactions.** A signature **acid cursor ring**
  (`CustomCursor.tsx`) trails the pointer and grows over interactive elements —
  desktop fine-pointer only, disabled for touch and reduced-motion, with the
  native cursor left intact.

### v0.8.0 — on-site booking + dashboard leads
- **Calendly-style calendar + email sign-up gate.** The booking modal is now a
  real **month-grid calendar** (two-pane: calendar left, ET times right; bookable
  days outlined, selected day acid, off days dimmed). Before scheduling, a
  prospect must **verify their email**: enter it → we email a 6-digit code
  (`/api/signup`) → verify (`/api/signup/verify`) → they get a one-time
  **welcome email** and a short-lived signed booker token that `/api/book` now
  requires — so every booking is tied to a proven inbox (no junk bookings). On
  booking, the prospect also gets a **confirmation email with the .ics attached**.
  Verified state persists for the session (`booking_signups` table, v5 migration).
  ⚠ Codes/welcome/confirmation emails reach **any** address only once a domain is
  verified in Resend; on the shared sandbox sender they only reach the account
  owner. If Resend isn't configured at all, the gate disables itself so booking
  still works.
- **Availability settings.** A dashboard **Availability** panel controls which
  weekdays + time slots are bookable, blocks specific dates (vacations), and sets
  how many days ahead to show. The modal reads it from `/api/availability`; the
  server validates every booking against it. Stored in `booking_settings`
  (single row), with defaults that mirror the original behavior pre-migration.
- **Book a discovery call, on-brand.** "Book a Meeting" (hero) and the Contact
  card open a branded modal: pick a weekday → pick an ET time slot (already-taken
  slots are greyed out) → name/email/business/notes → confirmation. No third-party
  embed; it's GES through and through. Saves to a new `bookings` table (one meeting
  per slot, enforced by a unique constraint).
- **Bookings land in the dashboard.** A new **Bookings** panel shows every lead
  (date/time, name, email, business, notes) with a "new" count, mark-done and
  delete. New routes `app/api/book` (public) and `app/api/dev/bookings` (gated).
- **Email notification (Resend).** When the `RESEND_API_KEY` + `BOOKING_NOTIFY_EMAIL`
  env vars are set, every booking emails you the lead's details + an `.ics`
  attachment (`lib/email.ts`, one fetch, no SDK) — no domain verification needed
  to email yourself. Best-effort, never blocks the booking.
- **Self-serve reschedule / cancel.** The confirmation email carries a signed
  manage link (`/booking/<token>`, 60-day token) where the prospect can cancel
  (frees the slot) or reschedule via the same calendar — `app/api/book/manage`.
  A partial unique index (v6 migration) means cancelled slots open back up while
  active double-booking is still blocked.
- **Calendar everywhere.** Confirmation offers "Add to Google Calendar" + an
  `.ics` (Apple/Outlook) with a reminder, GES added as a guest. And if the
  Google service-account env vars are set (`GOOGLE_SERVICE_ACCOUNT_EMAIL` /
  `GOOGLE_PRIVATE_KEY` / `GOOGLE_CALENDAR_ID`), the server auto-creates the event
  on GES's Google Calendar on every booking (`lib/gcal.ts`, signed-JWT service
  account, no extra deps) so you're notified — best-effort, never blocks a lead.
- **Graceful pre-migration.** Until you run
  `supabase/migrations/2026-06-11-v3-bookings.sql`, the slot list reads empty and
  the modal/dashboard show a clear "run the migration" message instead of breaking.
- Also: dashboard restructured to per-client **Manage** panels (live preview
  thumbnail + access code + upload/replace + analytics; the standalone target-client
  uploader is gone); the beige (`--bone`) was warmed so it no longer reads as white.

### v0.7.0 — viewer analytics, personalized portal
- **Viewer analytics in the dashboard.** Every successful access-code entry is
  logged. Each client card shows a **Viewed / Not viewed** badge and an inline
  "👁 viewed 2h ago · 3×" signal; an expandable **Analytics** panel shows
  **total opens, first open, last open**, and a full **open timeline** (each
  visit, newest first). The stat strip adds **Viewed by client** and **Total
  views**. So you know exactly when a prospect opened their preview — and how
  often — to time the follow-up call.
- **How it's stored.** Aggregate counters (`view_count`, `first_viewed_at`,
  `last_viewed_at`) live on the client row for fast list display; a
  `client_views` event-log table holds one row per open for the timeline.
  Recording is best-effort and never blocks the client's login.
- **Personalized client portal.** The gate greets the prospect by business name
  (via the public, non-sensitive `/api/preview-meta` — business name + ready
  only, no codes or analytics); the authed header shows the
  business name; an unknown slug gets a proper "No preview at this address" page
  instead of a code box that can never work.
- **Recoverable access codes.** The generated 64-char code is now also stored in
  plaintext on the client row (`access_code`) and revealed (show/copy) from the
  per-client panel — so a forgotten code can be looked up later instead of being
  rotated. (Trade-off: codes are readable by anyone with DB access; fine for these
  low-stakes preview gates.)
- **Two-factor dashboard login.** `/Developer-Dashboard-Page` now requires a
  **password *and* a date of birth** (`DEV_DASHBOARD_PASSWORD` + `DEV_DASHBOARD_DOB`),
  both checked constant-time with a single generic error.
- **Add Client simplified.** The form is now just **business name + optional
  custom slug** (with a live `/preview/<slug>` preview); the **industry** field
  was removed everywhere. **Re-uploading a build cleanly replaces** the old one
  (existing files are wiped first) so nothing stale lingers.
- **Schema v2 + graceful migration.** `supabase/schema.sql` creates the full v2
  schema (analytics columns + `access_code` + `client_views`); existing DBs run
  `supabase/migrations/2026-06-11-v2-analytics-and-codes.sql`. The app **runs on a
  pre-migration DB** — analytics read as zero/empty and code storage falls back
  until you migrate.
- Earlier in this line: portal rebranded to GES acid/amber glass; dashboard
  search/skeletons/error states; sandboxed preview iframe; production requires
  real env vars; fixed the doubled `<base href>` that broke relative-path
  builds; fixed the flaky hero video loop; anchor-scroll offset + focus rings;
  reduced-motion support; OpenGraph/Twitter metadata.

### v0.6.0 — view + download builds, zero-setup dashboard access
- **View & Download per client.** Each client row in the dashboard now has a
  **View** (opens the live build in a new tab via a dev-minted preview token — no
  client code needed) and **Download** (saves the uploaded build as a `.zip`).
  Both are Bearer-gated and enabled once a build is live. New routes
  `app/api/dev/preview-token/` and `app/api/dev/download/`; the zip is built by a
  dependency-free writer in `lib/zip.ts` (STORE method + CRC32), and the recursive
  storage walk now lives in `lib/storage.ts` (shared by clients + download).
- **Works out of the box.** The dashboard password defaults to `Brendan!202` and
  `SESSION_SECRET` has a built-in fallback, so login works with no env setup. ⚠
  Both defaults live in the repo — **set `DEV_DASHBOARD_PASSWORD` and a real
  `SESSION_SECRET` in production** (`.env.local` + Vercel) to override them.
- **Clearer upload help.** The uploader spells out the workflow: build locally
  (`npm install` → `npm run build`), then upload the `dist/`/`out/` output —
  `node_modules`/`.git`/`.next` are skipped and never need uploading.

### v0.5.0 — generated codes + full-render previews
- **Access codes are auto-generated.** The manual code field is gone; adding a
  client mints a **64-char** random code (A–Z a–z 0–9), stores only its hash, and
  reveals the plaintext **once** in a copy dialog. Each client gets a **New code**
  (rotate) action.
- **Uploaded builds render fully.** `/raw/<token>` now rewrites root-absolute URLs
  (attrs + CSS `url()`/`@import`) to the gated prefix and adds an `index.html` SPA
  fallback — so plain one-pagers and Vite `dist/` work end-to-end (Next `out/`
  renders; full client routing needs a build-time `basePath` — see caveat above).
- **Hardening.** Client delete now removes Storage files **recursively**; the
  uploader warns about files over Vercel's ~4.5 MB request limit; client-login
  placeholders updated and the public demo-codes hint removed.

### v0.4.0 — database-backed client previews
- **Supabase** replaces `data/clients.json`: a `clients` table + a private
  `client-previews` Storage bucket (`supabase/schema.sql`).
- **Real previews.** Each client preview lives at `/preview/<business>`; the build
  is streamed from Storage (with `<base>` injection) via an internal `/raw/<token>`
  route loaded in an iframe, so the address bar stays clean. The old JSON-driven
  templated preview was removed.
- **No cookies.** The code is entered on the preview page → short-lived HMAC token
  held in `sessionStorage` only (never in the URL); a new session re-enters the
  code. Not-yet-uploaded builds show a "not finished" page.
- **Developer dashboard** at `/Developer-Dashboard-Page` (password-gated) to add
  clients and upload build folders (skips `node_modules`/`.git`/`.next`, requires
  `index.html`).

### v0.3.0 — footer pages + navigation
- **Footer links are live.** The dead `<span>`s are now real `<Link>`s.
  **Services** and **Legal** open dedicated pages; **Company** points at the home
  anchors (`/#ownership`, `/#process`) and the client portal.
- **Standalone content pages.** New `app/(site)` route group with a shared
  solid-nav + footer layout, powered by two data-driven components —
  `ServiceDetail` (3 service pages) and `LegalDoc` (Privacy Policy, Terms of
  Service).
- **Navigation.** Added a `forceSolid` prop so the bar stays readable over light
  pages; the logo smooth-scrolls to the first section when already on `/` and
  routes home from any sub-page.

### v0.2.0 — 360° viewer + showcase polish
- **Bike showcase:** removed the edge-bleed letterbox (the "stretched colours"
  on the X/Y bars); section + canvas + bars are now one flat `#000000` matching
  the render. Rewrote part labels for legibility (acid border, white 11px text,
  snap-to-full opacity). Heading now fully fades out before 20% of the scroll.
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
