"use client";

import { useRef, useEffect, useState, forwardRef } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

const FRAME_COUNT = 192;
const framePath = (i: number) =>
  `/bike-frames/frame-${String(i + 1).padStart(4, "0")}.webp`;

// The frame scrub completes at this scroll progress; the remaining scroll is a
// static HOLD so visitors can read every part label before the section releases.
const SCRUB_END = 0.66;

// The heading is fully gone by this scroll progress and never returns.
const HEADER_FADE_END = 0.2;

// The whole scene dissolves to black across this range, then stays gone, so it
// melts into the next section instead of snapping back at the boundary.
const SCENE_DISSOLVE_START = 0.88;
const SCENE_DISSOLVE_END = 0.99;

// Show the full composed frame (no zoom-in). The exploded render places the
// wheels right at the edges, so any overscale slices them in half — 1.0 keeps
// every part whole.
const FILL_SCALE = 1.0;

// The render's backdrop is flat black. We clear the canvas (and paint the whole
// section) to the EXACT same black, so the letterbox bars on the short axis read
// as a seamless continuation of the footage. No edge-stretching, so there are no
// smeared colour streaks down the sides, and no visible seam between the section
// background and the frames.
const BG = "#000000";

/**
 * Name-only callouts. Each label snaps in over the *settled* exploded layout and
 * sits on its part. Coords are 0–100 within the drawn (contained) image, so they
 * track the bike at any viewport ratio.
 */
type Part = {
  label: string;
  x: number;
  y: number;
  at: number; // scroll progress at which the name finishes fading in
  hideMobile?: boolean;
};

const PARTS: Part[] = [
  { label: "Saddle", x: 31, y: 13, at: 0.52 },
  { label: "Handlebar", x: 82, y: 12, at: 0.55, hideMobile: true },
  { label: "Frame", x: 37, y: 42, at: 0.57 },
  { label: "Battery", x: 49, y: 59, at: 0.59 },
  { label: "Fork", x: 72, y: 47, at: 0.61 },
  { label: "Drivetrain", x: 72, y: 84, at: 0.63, hideMobile: true },
];

type Rect = { x: number; y: number; w: number; h: number };

// Position is declarative (tracks the contained image rect); opacity is driven
// imperatively by the parent's scroll handler so it snaps in then HOLDS at full —
// framer's MotionValue-to-style binding gets hardware-accelerated onto a native
// ViewTimeline that mis-tracks this pinned section and made labels fade back out.
const PartLabel = forwardRef<HTMLDivElement, { part: Part; index: number; rect: Rect }>(
  function PartLabel({ part, index, rect }, ref) {
    const left = rect.x + (part.x / 100) * rect.w;
    const top = rect.y + (part.y / 100) * rect.h;
    return (
      <div
        ref={ref}
        style={{ opacity: 0, left, top, transform: "translate(-50%, -50%)" }}
        className={`absolute z-20 pointer-events-none select-none ${
          part.hideMobile ? "hidden sm:block" : ""
        }`}
      >
        {/* Acid border + white text reads instantly against the black void; the
            dark offset shadow keeps it from blending where it overlaps the bike. */}
        <span className="inline-flex items-center gap-2 bg-[#0a0a0a] border-2 border-[#ccff00] px-2.5 py-1.5 shadow-[3px_3px_0_rgba(0,0,0,0.9)]">
          <span className="w-2 h-2 bg-[#ccff00]" />
          <span className="mono text-[11px] font-bold uppercase tracking-[0.16em] text-white whitespace-nowrap">
            {String(index + 1).padStart(2, "0")} {part.label}
          </span>
        </span>
      </div>
    );
  }
);

export default function BikeShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrame = useRef(0);
  const headingRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  // The heading is visible the instant the section pins (over the still-assembled
  // bike), then fades cleanly OUT — fully gone by HEADER_FADE_END of the scroll —
  // and never comes back. It is driven IMPERATIVELY (see the scroll handler below)
  // instead of binding a scroll-derived MotionValue to style: framer hardware-
  // accelerates that binding onto a native ViewTimeline, whose progress doesn't
  // track this pinned 600vh section, which made the heading fade out and then
  // creep back in. Setting opacity by hand in the proven scroll handler keeps the
  // fade strictly one-way.

  // The fully-exploded + labeled bike HOLDS through the middle of the scroll so
  // there's genuine time to read every part, THEN the whole scene dissolves to
  // black into the next section. No hard cut, no frozen linger. Driven imperatively
  // for the same reason as the heading — framer's ViewTimeline acceleration made
  // the dissolved scene pop back to full opacity right at the section boundary.

  // ── Fit the frame inside the viewport canvas (contain) ──
  const computeRect = (cssW: number, cssH: number): Rect => {
    const img = imagesRef.current[0];
    const imgAspect =
      img && img.naturalWidth ? img.naturalWidth / img.naturalHeight : 16 / 9;
    const canvasAspect = cssW / cssH;
    // CONTAIN: keep the whole composed frame visible (so the percentage-
    // positioned part labels stay mapped on screen, even on portrait phones).
    // The short axis gets flat-black bars that match the render's own backdrop.
    let w: number, h: number;
    if (canvasAspect > imgAspect) {
      h = cssH;
      w = h * imgAspect;
    } else {
      w = cssW;
      h = w / imgAspect;
    }
    w *= FILL_SCALE;
    h *= FILL_SCALE;
    return { x: (cssW - w) / 2, y: (cssH - h) / 2, w, h };
  };

  // ── Draw a frame, contained, on a flat-black canvas (no edge stretching) ──
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    currentFrame.current = index;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cssW = canvas.clientWidth || 1;
    const cssH = canvas.clientHeight || 1;
    const dpr = canvas.width / cssW;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = imagesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const r = computeRect(cssW, cssH);
    ctx.drawImage(img, r.x * dpr, r.y * dpr, r.w * dpr, r.h * dpr);
  };

  // ── Size the canvas backing store to the viewport (dpr-aware), refresh label rect, redraw ──
  const sizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (!cssW || !cssH) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    setRect(computeRect(cssW, cssH));
    drawFrame(currentFrame.current);
  };

  // ── Preload every frame ──
  useEffect(() => {
    let count = 0;
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = img.onerror = () => {
        count++;
        setLoaded(count);
        if (i === 0) sizeCanvas();
        if (i === currentFrame.current) drawFrame(i);
        if (count === FRAME_COUNT) {
          setReady(true);
          drawFrame(currentFrame.current);
        }
      };
      imgs[i] = img;
    }
    imagesRef.current = imgs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keep the canvas matched to the viewport ──
  useEffect(() => {
    sizeCanvas();
    const onResize = () => sizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── One place that maps the scroll value → every scroll-driven visual here.
  //    Everything is applied IMPERATIVELY rather than binding scroll-derived
  //    MotionValues to style: framer hardware-accelerates those onto a native
  //    ViewTimeline that does NOT track this pinned 600vh section, which made the
  //    heading and labels fade back in/out and the dissolved scene snap back to
  //    full opacity right at the boundary. ──
  const applyScroll = (v: number) => {
    // Frame scrub: finishes at SCRUB_END, then the last frame HOLDS so the fully
    // exploded, labeled bike stays on screen long enough to actually read.
    const p = Math.min(1, v / SCRUB_END);
    const idx = Math.min(
      FRAME_COUNT - 1,
      Math.max(0, Math.round(p * (FRAME_COUNT - 1)))
    );
    if (idx !== currentFrame.current) drawFrame(idx);

    // Heading: one-way fade, 1 at the top → 0 by HEADER_FADE_END, then stays gone.
    const h = headingRef.current;
    if (h) h.style.opacity = String(Math.max(0, 1 - v / HEADER_FADE_END));

    // Part labels: each snaps in just before its name settles, then HOLDS at full
    // so there's genuine time to read it.
    for (let i = 0; i < PARTS.length; i++) {
      const el = labelRefs.current[i];
      if (!el) continue;
      const o = (v - (PARTS[i].at - 0.05)) / 0.04;
      el.style.opacity = String(Math.min(1, Math.max(0, o)));
    }

    // Scene dissolve: holds at 1, fades to 0 across the dissolve range, stays 0.
    const s = sceneRef.current;
    if (s) {
      const d =
        (v - SCENE_DISSOLVE_START) /
        (SCENE_DISSOLVE_END - SCENE_DISSOLVE_START);
      s.style.opacity = String(Math.min(1, Math.max(0, 1 - d)));
    }
  };

  useMotionValueEvent(scrollYProgress, "change", applyScroll);

  // Re-apply once the labels actually mount (frames finished loading) or the rect
  // changes, so opacities are correct even if the section is already in view and
  // the user isn't actively scrolling at that moment.
  useEffect(() => {
    if (ready) applyScroll(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, rect]);

  const pct = Math.round((loaded / FRAME_COUNT) * 100);

  return (
    <section
      id="showcase"
      ref={trackRef}
      className="sec-dark relative"
      style={{ height: "600vh", backgroundColor: BG }}
    >
      <div
        ref={sceneRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ backgroundColor: BG, opacity: 1 }}
      >
        {/* full-bleed scrubbing canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* ── Heading (clears out as the explosion takes over) ── */}
        <div
          ref={headingRef}
          style={{ opacity: 1 }}
          className="absolute top-0 left-0 right-0 z-20 pt-20 sm:pt-28 px-6 text-center pointer-events-none"
        >
          <h2 className="display text-[1.1rem] sm:text-[clamp(2rem,6vw,4.5rem)] text-white">
            Products Your Customers{" "}
            <span className="inline-block bg-[#ccff00] text-[#0a0a0a] px-2">
              Take Apart
            </span>
          </h2>
        </div>

        {/* ── Brutalist part callouts ── */}
        {ready &&
          rect.w > 0 &&
          PARTS.map((p, i) => (
            <PartLabel
              key={p.label}
              part={p}
              index={i}
              rect={rect}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
            />
          ))}

        {/* ── Loader ── */}
        {!ready && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-black">
            <div className="w-72 max-w-[82vw]">
              <div className="flex items-center justify-between mono text-[11px] font-bold uppercase tracking-[0.15em] text-white mb-2">
                <span>Loading</span>
                <span className="text-[#ccff00]">{pct}%</span>
              </div>
              <div className="h-4 border-2 border-white">
                <div
                  className="h-full bg-[#ccff00] transition-all duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
