"use client";

import { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";

const FRAME_COUNT = 192;
const framePath = (i: number) =>
  `/bike-frames/frame-${String(i + 1).padStart(4, "0")}.webp`;

// The frame scrub completes at this scroll progress; the remaining scroll is a
// static HOLD so visitors can read every part label before the section releases.
const SCRUB_END = 0.66;

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

function PartLabel({
  part,
  index,
  progress,
  rect,
}: {
  part: Part;
  index: number;
  progress: MotionValue<number>;
  rect: Rect;
}) {
  // Snap to FULL opacity quickly, then hold — by the time the bike settles the
  // label is solidly readable, never a faint ghost.
  const opacity = useTransform(
    progress,
    [part.at - 0.05, part.at - 0.01],
    [0, 1]
  );
  const left = rect.x + (part.x / 100) * rect.w;
  const top = rect.y + (part.y / 100) * rect.h;

  return (
    <motion.div
      style={{ opacity, left, top, transform: "translate(-50%, -50%)" }}
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
    </motion.div>
  );
}

export default function BikeShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrame = useRef(0);

  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  // The title owns the opening third of the scroll (its own moment), then clears
  // well before any part label appears.
  const headerOpacity = useTransform(scrollYProgress, [0, 0.18, 0.3], [1, 1, 0]);

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

  // ── Map scroll → frame index. The scrub finishes at SCRUB_END, then the last
  //    frame HOLDS for the rest of the scroll so the fully-exploded, fully-
  //    labeled bike stays on screen long enough to actually read. ──
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const p = Math.min(1, v / SCRUB_END);
    const idx = Math.min(
      FRAME_COUNT - 1,
      Math.max(0, Math.round(p * (FRAME_COUNT - 1)))
    );
    if (idx !== currentFrame.current) drawFrame(idx);
  });

  const pct = Math.round((loaded / FRAME_COUNT) * 100);

  return (
    <section
      id="showcase"
      ref={trackRef}
      className="sec-dark relative"
      style={{ height: "600vh", backgroundColor: BG }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ backgroundColor: BG }}
      >
        {/* full-bleed scrubbing canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* ── Heading (clears out as the explosion takes over) ── */}
        <motion.div
          style={{ opacity: headerOpacity }}
          className="absolute top-0 left-0 right-0 z-20 pt-24 sm:pt-28 px-6 text-center pointer-events-none"
        >
          <h2 className="display text-[clamp(2rem,6vw,4.5rem)] text-white">
            Products Your Customers{" "}
            <span className="inline-block bg-[#ccff00] text-[#0a0a0a] px-2">
              Take Apart
            </span>
          </h2>
        </motion.div>

        {/* ── Brutalist part callouts ── */}
        {ready &&
          rect.w > 0 &&
          PARTS.map((p, i) => (
            <PartLabel
              key={p.label}
              part={p}
              index={i}
              progress={scrollYProgress}
              rect={rect}
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
