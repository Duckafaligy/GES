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

  // Seamless loop + resilient autoplay. Product-hero clips often hold on their
  // final frame for up to a second before restarting, which reads as a dead
  // pause. We optionally skip that trailing hold — but only when it's a clear,
  // sustained freeze in the LAST fifth of the clip, so a slow-moving subject
  // (a watch turning on black) can't be mistaken for a freeze and collapse the
  // hero into a near-static micro-loop. Native `loop` is the safety net.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // React doesn't reliably set the muted *property* from the JSX attribute, and
    // browsers (tablets/iPadOS especially) only allow autoplay when the element
    // is provably muted — so set it on the DOM node directly. This is the usual
    // reason a hero video autoplays on desktop/phone but not tablet.
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.playsInline = true;

    // ── Resilient autoplay: some browsers ignore the attribute, defer it, or
    //    pause the video when the tab is backgrounded. Nudge it whenever we can.
    const ensurePlaying = () => {
      if (v.paused) v.play().catch(() => {});
    };
    ensurePlaying();
    v.addEventListener("loadeddata", ensurePlaying);
    v.addEventListener("canplay", ensurePlaying);
    v.addEventListener("loadedmetadata", ensurePlaying);
    const onVisible = () => { if (!document.hidden) ensurePlaying(); };
    document.addEventListener("visibilitychange", onVisible);

    // Last-resort fallback: if autoplay was still blocked, start on the very
    // first user interaction anywhere on the page, then stop listening.
    const kick = () => {
      v.muted = true;
      v.play().catch(() => {});
      if (!v.paused) removeKick();
    };
    const kickEvents = ["pointerdown", "touchstart", "click", "keydown", "scroll"] as const;
    const removeKick = () => kickEvents.forEach((e) => window.removeEventListener(e, kick));
    kickEvents.forEach((e) => window.addEventListener(e, kick, { passive: true }));

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 18;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let prev: Uint8ClampedArray | null = null;
    let frozenMs = 0;
    let cutAt = Infinity; // learned cut time (s); the hold begins just after it
    let learn = !!ctx;    // disable learning if we can't sample (just native loop)
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    const SAMPLE_MS = 80; // ~12 samples/sec — trivial on a 32×18 canvas

    const restart = () => {
      prev = null;
      frozenMs = 0;
      v.currentTime = 0;
      v.play().catch(() => {});
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = now - last;
      last = now;
      if (v.paused || !v.videoWidth || !Number.isFinite(v.duration)) return;

      // Once the hold point is known, cut just before it — checked every frame.
      if (v.currentTime >= cutAt) { restart(); return; }
      if (!learn || Number.isFinite(cutAt)) return; // learned/disabled: native loop

      // First pass only: sample frames to find where motion stops.
      acc += dt;
      if (acc < SAMPLE_MS) return;
      acc = 0;

      try {
        ctx!.drawImage(v, 0, 0, canvas.width, canvas.height);
        const cur = ctx!.getImageData(0, 0, canvas.width, canvas.height).data;
        if (prev) {
          let diff = 0;
          for (let i = 0; i < cur.length; i += 4) {
            diff += Math.abs(cur[i] - prev[i]) + Math.abs(cur[i + 1] - prev[i + 1]);
          }
          const changed = diff / (cur.length / 4); // avg channel delta per pixel
          if (changed < 1.2) frozenMs += SAMPLE_MS;
          else frozenMs = 0;
        }
        prev = cur;

        // A SUSTAINED freeze (≥0.4s) in the last 20% of the clip = real trailing
        // hold. Cut where it began, but never earlier than 80% in, so even a
        // misread can only ever trim the very tail — never the whole animation.
        if (frozenMs >= 400 && v.currentTime > v.duration * 0.8) {
          const began = v.currentTime - frozenMs / 1000 - 0.1;
          cutAt = Math.max(v.duration * 0.8, began);
          restart();
        }
      } catch {
        learn = false; // tainted canvas / read error → stop learning, keep looping
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("loadeddata", ensurePlaying);
      v.removeEventListener("canplay", ensurePlaying);
      v.removeEventListener("loadedmetadata", ensurePlaying);
      document.removeEventListener("visibilitychange", onVisible);
      removeKick();
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
