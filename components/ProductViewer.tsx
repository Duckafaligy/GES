"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";

/**
 * Interactive 360° turntable driven by PRE-SPLIT frames.
 *
 * The clip is exported once to a sequence of still frames (one image per ~1.9°).
 * We preload them as plain <img>s and blit the nearest frame to a <canvas>, so:
 *   • idle = a gentle auto-spin (rAF steps through the frames),
 *   • drag = frame-perfect rotation that maps 1:1 to your pointer,
 * and there's NO live video decode to stutter or "chop" — every angle is a real,
 * fully-decoded image. Vertical gestures fall through to page scroll (pan-y).
 */

const BG = "#0a0a0a";
const SPIN_FPS = 18; // idle auto-spin speed (frames/sec) → ~one rev / 10.2s @ 184
const RESUME_AFTER = 2600; // ms of stillness after a drag before the idle spin resumes

export default function ProductViewer({
  frameDir,
  frameCount = 0,
  sensitivity = 1.0,
}: {
  /** folder under /public holding frame-0001.webp … (no trailing slash) */
  frameDir: string;
  /** number of frames in the sequence */
  frameCount?: number;
  /** drag-to-rotate gain — 1.0 means a full-width swipe ≈ one full revolution */
  sensitivity?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const images = useRef<HTMLImageElement[]>([]);
  const ready = useRef(false); // all frames loaded
  const pos = useRef(0); // current frame index (float)
  const dragging = useRef(false);
  const moved = useRef(false);
  const lastX = useRef(0);
  const visible = useRef(false); // section is on-screen (don't spin off-screen)
  const resumeAt = useRef(0); // timestamp to resume the idle spin after a drag

  const [loaded, setLoaded] = useState(0);
  const [aspect, setAspect] = useState(1); // square render by default
  const [hintGone, setHintGone] = useState(false);

  const framePath = (i: number) =>
    `${frameDir}/frame-${String(i + 1).padStart(4, "0")}.webp`;

  // ── Draw frame i, COVER-filled on a flat backdrop ──
  const draw = (i: number) => {
    const canvas = canvasRef.current;
    const n = images.current.length;
    if (!canvas || n === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = images.current[((Math.round(i) % n) + n) % n];
    const cssW = canvas.clientWidth || 1;
    const cssH = canvas.clientHeight || 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, cssW, cssH); // transform is dpr-scaled → clear in CSS px
    if (!img || !img.complete || !img.naturalWidth) return;
    const s = Math.max(cssW / img.naturalWidth, cssH / img.naturalHeight); // COVER
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (cssW - w) / 2, (cssH - h) / 2, w, h);
  };

  // ── Size the canvas backing store to its box (dpr-aware), then redraw ──
  const sizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (!cssW || !cssH) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(pos.current);
  };

  // ── Preload every frame ──
  useEffect(() => {
    if (!frameDir || !frameCount) return;
    let count = 0;
    let cancelled = false;
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = img.onerror = () => {
        if (cancelled) return;
        count++;
        setLoaded(count);
        if (i === 0 && img.naturalWidth) {
          setAspect(img.naturalWidth / img.naturalHeight);
          sizeCanvas();
          draw(0); // show the first frame the instant it lands (no blank box)
        }
        if (count === frameCount) ready.current = true;
      };
      imgs[i] = img;
    }
    images.current = imgs;
    return () => {
      cancelled = true;
      images.current = [];
      ready.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameDir, frameCount]);

  // ── Idle auto-spin + drag-to-rotate ──
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // keep the canvas sized to the box
    sizeCanvas();
    const onResize = () => sizeCanvas();
    window.addEventListener("resize", onResize);

    // only spin while the turntable is actually on screen
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(wrap);

    // gentle continuous spin when idle, on-screen, and ready
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = now - last;
      last = now;
      if (
        reduce ||
        dragging.current ||
        !ready.current ||
        !visible.current ||
        now < resumeAt.current
      )
        return;
      pos.current += (SPIN_FPS * dt) / 1000;
      draw(pos.current);
    };
    raf = requestAnimationFrame(tick);

    // ── pointer: drag = rotate ──
    const onDown = (e: PointerEvent) => {
      if (!ready.current) return; // still preloading → ignore
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragging.current = true;
      moved.current = false;
      lastX.current = e.clientX;
      setHintGone(true);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      const n = images.current.length || 1;
      // drag right → rotate like grabbing a real turntable
      pos.current -= (dx / wrap.clientWidth) * n * sensitivity;
      moved.current = true;
      draw(pos.current);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      resumeAt.current = performance.now() + RESUME_AFTER; // hold, then resume spin
    };

    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    wrap.addEventListener("pointerleave", onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
      wrap.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
      wrap.removeEventListener("pointercancel", onUp);
      wrap.removeEventListener("pointerleave", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensitivity]);

  const pct = frameCount ? Math.round((loaded / frameCount) * 100) : 0;
  const isReady = frameCount > 0 && loaded >= frameCount;

  return (
    <div>
      <div className="eyebrow text-[var(--muted)] mb-4">Live 360° Preview</div>
      <div
        ref={wrapRef}
        className="relative w-full mx-auto overflow-hidden bg-[#0a0a0a] border-2 border-[var(--line)] shadow-[6px_6px_0_0_var(--line)] select-none cursor-grab active:cursor-grabbing"
        style={{
          aspectRatio: aspect,
          maxHeight: "80vh",
          // square render → cap width so an 80vh-tall box keeps its aspect, centered
          maxWidth: `calc(80vh * ${aspect})`,
          touchAction: "pan-y",
        }}
      >
        {/* the turntable itself */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* acid corner ticks */}
        <span className="pointer-events-none absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--acid)]" />
        <span className="pointer-events-none absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--acid)]" />
        <span className="pointer-events-none absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--acid)]" />
        <span className="pointer-events-none absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--acid)]" />

        {/* badge */}
        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 px-2 py-1">
          <RotateCw size={11} className="text-[var(--acid)]" />
          <span className="mono text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            360° Drag
          </span>
        </div>

        {/* invite-to-interact hint (disappears on first grab) */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-3 flex justify-center transition-opacity duration-500 ${
            hintGone || !isReady ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="mono text-[10px] font-bold uppercase tracking-[0.14em] text-white bg-black/70 px-2.5 py-1">
            Drag left / right to rotate
          </span>
        </div>

        {/* preparing-frames loader (brief; clears the moment all frames are in) */}
        {!isReady && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/55 backdrop-blur-[1px]">
            <div className="w-56 max-w-[70%]">
              <div className="flex items-center justify-between mono text-[10px] font-bold uppercase tracking-[0.15em] text-white mb-2">
                <span>Preparing 360°</span>
                <span className="text-[var(--acid)]">{pct}%</span>
              </div>
              <div className="h-3 border-2 border-white">
                <div
                  className="h-full bg-[var(--acid)] transition-all duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
