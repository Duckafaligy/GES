"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";

const PROJECTS = [
  {
    name: "CLIME",
    tag: "E-Commerce",
    url: "https://clime-dragons-den.vercel.app",
    img: "/portfolio/clime.png",
    blurb:
      "Wireless heat & cold therapy devices — a cinematic product hero, interactive device showcase, and a pre-order flow built to actually sell.",
  },
  {
    name: "Ontario Thriving Development Program",
    tag: "Platform",
    url: "https://otdp.vercel.app",
    img: "/portfolio/otdp.png",
    blurb:
      "A free, multilingual study-help platform for every Ontario student — fast onboarding, clean UX, and conversion-first sign-up.",
  },
];

export default function Work() {
  return (
    <section id="work" className="sec-dark py-24 border-t-2 border-[var(--line)]">
      <div className="max-w-6xl mx-auto px-5">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-12 border-b-2 border-[var(--line)] pb-4">
          <span className="eyebrow">06 / Work</span>
          <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
          <span className="eyebrow text-[var(--amber)]">Selected Builds</span>
        </div>

        {/* Featured testimonial */}
        <motion.blockquote
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="hard bg-[var(--bg)] p-8 md:p-11 mb-12 relative"
        >
          <Quote size={34} className="text-[var(--acid)] mb-4" />
          <p className="display text-2xl md:text-[2.5rem] leading-[1.1] max-w-4xl">
            They turned our idea into a storefront that{" "}
            <span className="bg-[var(--acid)] text-[#0a0a0a] px-2 inline-block">actually converts</span>{" "}
            — the product hero alone had people pre-ordering.
          </p>
          <footer className="mono text-xs uppercase tracking-[0.14em] text-[var(--muted)] mt-6">
            — CLIME · Wireless Heat &amp; Cold Therapy
          </footer>
        </motion.blockquote>

        {/* Project cards */}
        <div className="grid md:grid-cols-2 gap-7">
          {PROJECTS.map((p, i) => (
            <motion.a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="hard lift bg-[var(--bg)] group block overflow-hidden"
            >
              <div className="border-b-2 border-[var(--line)] overflow-hidden">
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
                <p className="text-[var(--muted)] text-sm leading-relaxed">{p.blurb}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
