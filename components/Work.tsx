"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import CountUp from "@/components/CountUp";

interface Project {
  name: string;
  short: string;
  tag: string;
  status: string;
  live: boolean;
  url: string;
  img: string;
  blurb: string;
  price: number;
  breakdown: { item: string; cost: number }[];
}

const PROJECTS: Project[] = [
  {
    name: "CLIME",
    short: "CLIME",
    tag: "E-Commerce",
    status: "Demo build",
    live: false,
    url: "https://clime-dragons-den.vercel.app",
    img: "/portfolio/clime.png",
    blurb:
      "A full e-commerce concept build — cinematic product hero, interactive device showcase, and a pre-order flow. A demo (not a live store), built to show exactly what we ship.",
    price: 3200,
    breakdown: [
      { item: "Base e-commerce build", cost: 1400 },
      { item: "Cinematic 3D product hero", cost: 1000 },
      { item: "Scroll-driven animation", cost: 400 },
      { item: "Product pages (×6)", cost: 400 },
    ],
  },
  {
    name: "Ontario Thriving Development Program",
    short: "OTDP",
    tag: "Platform",
    status: "Live · real org",
    live: true,
    url: "https://otdp.vercel.app",
    img: "/portfolio/otdp.png",
    blurb:
      "A real, live platform for an Ontario organization — free multilingual study help for students, with fast onboarding and conversion-first sign-up.",
    price: 2200,
    breakdown: [
      { item: "Base platform build", cost: 1500 },
      { item: "Extra pages (×8)", cost: 350 },
      { item: "Custom onboarding & flows", cost: 350 },
    ],
  },
  {
    name: "LaunchVault",
    short: "LaunchVault",
    tag: "SaaS / AI",
    status: "Live · real org",
    live: true,
    url: "https://launchvault.ca",
    img: "/portfolio/launchvault.png",
    blurb:
      "A live AI-learning SaaS — “Your AI Mastery Engine.” Turns the firehose of AI into a ranked daily feed of prompts, agents and courses across 50 domains, with accounts and Stripe subscriptions.",
    price: 6500,
    breakdown: [
      { item: "Platform & design system", cost: 2000 },
      { item: "Auth + Stripe subscriptions", cost: 1600 },
      { item: "Dynamic content engine (ranked feed)", cost: 2000 },
      { item: "Pricing / Stories / onboarding", cost: 900 },
    ],
  },
];

const money = (n: number) => `$${n.toLocaleString()}`;

export default function Work() {
  return (
    <section id="work" className="sec-dark py-24 border-t-2 border-[var(--line)]">
      <div className="max-w-6xl mx-auto px-5">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-12 border-b-2 border-[var(--line)] pb-4">
          <span className="eyebrow">05 / Work</span>
          <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
          <span className="eyebrow text-[var(--amber)]">Selected Builds</span>
        </div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-3xl"
        >
          <h2 className="glow-acid display text-[clamp(2.2rem,5.5vw,4.5rem)] mb-5">
            Real Builds,{" "}
            <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2">Real Range</span>
          </h2>
          <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed">
            Live platforms powering real organizations — an AI-learning SaaS with
            subscriptions and a community study program — plus a full e-commerce concept
            that shows the bar we build to. Premium UI, conversion-first throughout.
          </p>
        </motion.div>

        {/* Project cards */}
        <div className="grid md:grid-cols-3 gap-7">
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.name} p={p} i={i} />
          ))}
        </div>

        {/* Price breakdown */}
        <div className="mt-14">
          <div className="flex items-center gap-4 mb-6 border-b-2 border-[var(--line)] pb-3">
            <span className="eyebrow text-[var(--amber)]">Price Breakdown</span>
            <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
            <span className="eyebrow text-[var(--muted)]">Indicative</span>
          </div>
          <div className="grid md:grid-cols-3 gap-7">
            {PROJECTS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="hard bg-[var(--bg)] p-6"
              >
                <div className="flex items-baseline justify-between mb-4">
                  <span className="font-extrabold uppercase tracking-tight">{p.short}</span>
                  <span className="display text-3xl text-[var(--acid)]">≈ <CountUp value={p.price} prefix="$" /></span>
                </div>
                <div className="space-y-2.5">
                  {p.breakdown.map((b) => (
                    <div key={b.item} className="flex items-baseline gap-2 mono text-[11px]">
                      <span className="text-[var(--fg)]">{b.item}</span>
                      <span className="flex-1 border-b border-dotted border-[var(--line)]/40 translate-y-[-2px]" />
                      <span className="text-[var(--muted)]">{money(b.cost)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          <p className="mono text-[11px] text-[var(--muted)] mt-5 leading-relaxed max-w-2xl">
            Indicative build values for these examples. Your exact quote depends on scope —
            number of products, 3D tiers, animations — and we walk you through it upfront on the call.
            <span className="text-[var(--fg)]"> No surprises.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Project card with a subtle pointer-driven 3D tilt (skipped for reduced-motion). */
function ProjectCard({ p, i }: { p: Project; i: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0); // -0.5 … 0.5 across the card
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 250, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 250, damping: 20 });

  function onMove(e: React.MouseEvent) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function reset() { mx.set(0); my.set(0); }

  return (
    <motion.a
      ref={ref}
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={onMove}
      onMouseLeave={reset}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: i * 0.08 }}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: "preserve-3d" }}
      className="hard lift bg-[var(--bg)] group block overflow-hidden"
    >
      <div className="border-b-2 border-[var(--line)] overflow-hidden relative">
        <span
          className={`absolute top-3 left-3 z-10 mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border-2 inline-flex items-center gap-1.5 ${
            p.live
              ? "bg-[#0a0a0a] text-[var(--acid)] border-[var(--acid)]"
              : "bg-[#0a0a0a] text-[var(--amber)] border-[var(--amber)]"
          }`}
        >
          {p.live && <span className="w-1.5 h-1.5 rounded-full bg-[var(--acid)]" />}
          {p.status}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.img}
          alt={`${p.name} — built by GES`}
          loading="lazy"
          className="w-full aspect-[16/10] object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="mono text-[10px] uppercase tracking-[0.16em] bg-[var(--acid)] text-[#0a0a0a] px-2 py-0.5 font-bold">{p.tag}</span>
          <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
        <div className="font-extrabold uppercase tracking-tight text-lg leading-tight mb-2">{p.name}</div>
        <p className="text-[var(--muted)] text-sm leading-relaxed mb-4">{p.blurb}</p>
        <div className="flex items-baseline justify-between border-t-2 border-[var(--line)]/30 pt-3">
          <span className="eyebrow text-[var(--muted)]">Est. build value</span>
          <span className="display text-2xl text-[var(--acid)]">≈ <CountUp value={p.price} prefix="$" /></span>
        </div>
      </div>
    </motion.a>
  );
}
