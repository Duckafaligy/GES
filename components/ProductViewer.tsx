"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";

/**
 * Interactive 360° product viewer driven by a short turntable video.
 *
 * Interaction is deliberately ONE thing: a left↔right swipe scrubs the video's
 * currentTime (wrap-around) so the product rotates. No zoom, no pinch, no pan —
 * vertical gestures fall through to normal page scroll (touch-action: pan-y).
 * When untouched the clip idle-spins (muted loop) for a "live" feel, then a swipe
 * pauses it and hands control to the drag; it resumes after a short idle.
 *
 * Seeks are CHAINED: only one seek is ever in flight, and the moment it lands we
 * jump straight to the newest target. That stops heavier clips (e.g. the premium
 * video) from piling up pending seeks — which is what made it feel laggy.
 */
export default function ProductViewer({
  src,
  sensitivity = 1.35,
}: {
  src: string;
  sensitivity?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Interaction state (refs, so dragging never triggers React re-renders) ──
  const autoSpin = useRef(true);
  const dragging = useRef(false);
  const seeking = useRef(false);
  const targetTime = useRef(0);
  const lastX = useRef(0);
  const idleTimer = useRef<number | null>(null);

  const [hintGone, setHintGone] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    const wrap = wrapRef.current;
    if (!v || !wrap) return;

    v.loop = true;
    v.muted = true;

    const wrapTime = (t: number) => {
      const d = v.duration || 1;
      return ((t % d) + d) % d;
    };

    // Seek-chaining — never issue a new seek while one is pending; when the
    // current seek lands, immediately chase the latest target if it moved.
    const chaseSeek = () => {
      if (autoSpin.current) return;
      if (Math.abs(v.currentTime - targetTime.current) < 0.002) return;
      seeking.current = true;
      v.currentTime = targetTime.current;
    };
    const onSeeked = () => {
      if (autoSpin.current) {
        seeking.current = false;
        return;
      }
      if (Math.abs(v.currentTime - targetTime.current) >= 0.002) {
        v.currentTime = targetTime.current; // keep chasing the freshest target
      } else {
        seeking.current = false;
      }
    };

    const startIdleResume = () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        autoSpin.current = true;
        seeking.current = false;
        v.play().catch(() => {});
      }, 2600);
    };

    const stopSpin = () => {
      autoSpin.current = false;
      v.pause();
      targetTime.current = v.currentTime;
    };

    const onPointerDown = (e: PointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragging.current = true;
      lastX.current = e.clientX;
      setHintGone(true);
      stopSpin();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      // A full drag across the viewer ≈ one full turntable revolution.
      const d = v.duration || 1;
      targetTime.current = wrapTime(
        targetTime.current - (dx / wrap.clientWidth) * d * sensitivity
      );
      if (!seeking.current) chaseSeek();
    };

    const endPointer = () => {
      if (!dragging.current) return;
      dragging.current = false;
      startIdleResume();
    };

    const onLoaded = () => {
      v.play().catch(() => {});
    };

    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("seeked", onSeeked);
    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", endPointer);
    wrap.addEventListener("pointercancel", endPointer);
    wrap.addEventListener("pointerleave", endPointer);

    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      v.removeEventListener("loadeddata", onLoaded);
      v.removeEventListener("seeked", onSeeked);
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", endPointer);
      wrap.removeEventListener("pointercancel", endPointer);
      wrap.removeEventListener("pointerleave", endPointer);
    };
  }, [src, sensitivity]);

  return (
    <div>
      <div className="eyebrow text-[var(--muted)] mb-4">Live 360° Preview</div>
      <div
        ref={wrapRef}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#0a0a0a] border-2 border-[var(--line)] shadow-[6px_6px_0_var(--line)] select-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
      >
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="auto"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* acid corner ticks */}
        <span className="pointer-events-none absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--acid)]" />
        <span className="pointer-events-none absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--acid)]" />
        <span className="pointer-events-none absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--acid)]" />
        <span className="pointer-events-none absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--acid)]" />

        {/* badge */}
        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 px-2 py-1">
          <RotateCw size={11} className="text-[var(--acid)]" />
          <span className="mono text-[10px] font-bold uppercase tracking-[0.14em] text-white">
            360° Swipe
          </span>
        </div>

        {/* first-touch hint */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-3 flex justify-center transition-opacity duration-500 ${
            hintGone ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="mono text-[10px] font-bold uppercase tracking-[0.14em] text-white bg-black/70 px-2.5 py-1">
            Swipe left / right to rotate
          </span>
        </div>
      </div>
    </div>
  );
}
