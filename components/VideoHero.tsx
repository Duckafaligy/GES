"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";

const stats = [
  { value: "100%", label: "Client Satisfaction" },
  { value: "3×", label: "Avg Conversion Lift" },
  { value: "21d", label: "Deposit → Live" },
  { value: "3D", label: "Product Rendering" },
];

export default function VideoHero() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);

  // Make the hero animate on EVERY device. We try smooth native playback first
  // (desktop/most phones allow muted inline autoplay). But some platforms
  // — iPadOS, Low-Power-Mode, strict tablets — HARD-refuse muted autoplay, and
  // no play() call can override that. So as a guaranteed fallback we drive the
  // frames ourselves by stepping `currentTime` in a rAF loop: seeking needs no
  // autoplay permission, so the clip still moves where play() is blocked.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // React doesn't reliably set the muted *property* from the JSX attribute,
    // and browsers only autoplay provably-muted video — set it on the node.
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.playsInline = true;

    const tryPlay = () => { v.muted = true; v.play().catch(() => {}); };
    tryPlay();

    const onReady = () => tryPlay();
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("canplay", onReady);
    v.addEventListener("loadedmetadata", onReady);
    const onVisible = () => { if (!document.hidden) tryPlay(); };
    document.addEventListener("visibilitychange", onVisible);

    // Start on the first user interaction too (covers gesture-required cases).
    const kickEvents = ["pointerdown", "touchstart", "click", "keydown", "scroll"] as const;
    const kick = () => tryPlay();
    kickEvents.forEach((e) => window.addEventListener(e, kick, { passive: true }));

    // Re-attempt native play for a few seconds (handles deferred autoplay).
    let tries = 0;
    const poll = setInterval(() => {
      if (!v.paused || tries++ > 20) { clearInterval(poll); return; }
      tryPlay();
    }, 400);

    // The clip holds on its final frame for ~1s before the end (measured with
    // ffmpeg: it goes static ~6.9s into the 7.96s file). Native `loop` only
    // restarts at the very end, so that hold reads as a dead pause every loop.
    // We restart early — just before the hold — so the loop is seamless.
    const TRAIL_TRIM = 1.1; // seconds of trailing static hold to skip
    const loopEndOf = (d: number) => (d > 2 ? d - TRAIL_TRIM : d);

    // Manual-scrub fallback: if it's STILL paused after a short grace (autoplay
    // hard-blocked), advance the frame ourselves ~24fps so it animates anyway.
    const GRACE_MS = 1500;
    const FRAME_MS = 1000 / 24;
    const t0 = performance.now();
    let lastSeek = 0;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const d = v.duration;
      if (!Number.isFinite(d) || d === 0) return;
      const loopEnd = loopEndOf(d);

      if (!v.paused) {
        // Native playback: jump back before the trailing freeze → no dead pause.
        if (v.currentTime >= loopEnd) { try { v.currentTime = 0; } catch {} }
        return;
      }
      // Paused (autoplay blocked): drive frames ourselves, looping at loopEnd.
      if (now - t0 < GRACE_MS) return;     // give real autoplay a chance first
      if (now - lastSeek < FRAME_MS) return;
      lastSeek = now;
      try { v.currentTime = ((now - t0 - GRACE_MS) / 1000) % loopEnd; } catch { /* not seekable yet */ }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(poll);
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("canplay", onReady);
      v.removeEventListener("loadedmetadata", onReady);
      document.removeEventListener("visibilitychange", onVisible);
      kickEvents.forEach((e) => window.removeEventListener(e, kick));
    };
  }, []);

  return (
    <section
      ref={ref}
      className="sec-dark relative min-h-screen flex items-center overflow-hidden"
    >
      {/* ── Full-bleed background video ── */}
      <motion.video
        ref={videoRef}
        style={{ scale: videoScale }}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/media/watch-hero.mp4" type="video/mp4" />
      </motion.video>

      {/* Scrim — darkens the footage for legibility and a heavier, pro mood */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-transparent to-black/55" />
      {/* faint construction grid layered over the video */}
      <div className="absolute inset-0 z-[2] grid-lines opacity-[0.16]" />

      {/* ── Foreground content ── */}
      <motion.div
        style={{ y: contentY, opacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-5 pt-32 pb-16"
      >
        {/* Eyebrow band */}
        <div className="entry-d0 flex items-center justify-between border-b-2 border-current pb-3 mb-7 max-w-3xl">
          <span className="eyebrow flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[var(--acid)]" />
            Global E-Commerce Saviours
          </span>
          <span className="eyebrow opacity-60">
            (01 — Landing<span className="blink">_</span>)
          </span>
        </div>

        {/* Headline */}
        <h1 className="entry-d1 display text-[clamp(2.6rem,8.5vw,7.5rem)] max-w-5xl">
          Be The Competitor
          <br />
          With The{" "}
          <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-3 -rotate-1">
            Edge
          </span>
        </h1>

        {/* Subcopy */}
        <p className="entry-d2 text-base md:text-lg text-[var(--muted)] leading-relaxed max-w-xl mt-8">
          We build{" "}
          <span className="text-[var(--fg)] font-bold">conversion-first websites</span>{" "}
          and lifelike 3D product experiences that turn a single booked call into
          more closed sales — so every meeting you take walks away worth more.
        </p>

        {/* CTAs */}
        <div className="entry-d3 flex flex-wrap gap-4 mt-9">
          <a href="#contact">
            <button className="btn-brut">
              Book a Meeting <ArrowRight size={16} />
            </button>
          </a>
          <a href="#services">
            <button className="btn-ghost">What We Build</button>
          </a>
        </div>

        {/* Stat cells */}
        <div className="entry-d4 grid grid-cols-2 md:grid-cols-4 border-t-2 border-l-2 border-current mt-12 max-w-3xl">
          {stats.map((s) => (
            <div
              key={s.label}
              className="border-b-2 border-r-2 border-current p-5 backdrop-blur-[2px]"
            >
              <div className="display text-3xl md:text-4xl">{s.value}</div>
              <div className="eyebrow mt-2 text-[var(--muted)]">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <div className="entry-d5 absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <span className="eyebrow text-[var(--muted)]">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={16} className="text-[var(--acid)]" />
        </motion.div>
      </div>
    </section>
  );
}
