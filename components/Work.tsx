"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const PROJECTS = [
  {
    name: "CLIME",
    tag: "E-Commerce",
    status: "Demo build",
    live: false,
    url: "https://clime-dragons-den.vercel.app",
    img: "/portfolio/clime.png",
    blurb:
      "A full e-commerce concept build — cinematic product hero, interactive device showcase, and a pre-order flow. A demo (not a live store), built to show exactly what we ship.",
  },
  {
    name: "Ontario Thriving Development Program",
    tag: "Platform",
    status: "Live · real org",
    live: true,
    url: "https://otdp.vercel.app",
    img: "/portfolio/otdp.png",
    blurb:
      "A real, live platform for an Ontario organization — free multilingual study help for students, with fast onboarding and conversion-first sign-up.",
  },
];

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
            A live platform powering a real Ontario organization, and a full e-commerce
            concept that shows the bar we build to — premium UI, lifelike product feel,
            conversion-first throughout.
          </p>
        </motion.div>

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
              <div className="border-b-2 border-[var(--line)] overflow-hidden relative">
                {/* status pill */}
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
                <p className="text-[var(--muted)] text-sm leading-relaxed">{p.blurb}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
