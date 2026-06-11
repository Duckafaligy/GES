"use client";

import { motion } from "framer-motion";
import { Search, Palette, Code2, Rocket, MessageSquare, ArrowRight } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: MessageSquare,
    title: "The Call",
    desc: "We reach out from our curated list of Canadian businesses. If you take the call, we learn your business, your customers, and dig into your social presence, reviews, and brand story.",
    duration: "Day 1",
  },
  {
    n: "02",
    icon: Search,
    title: "You Receive a Code",
    desc: "After the call, you get a unique client access code. Enter it in our Client Portal to unlock a tailored landing page preview built for your business — before you commit a cent.",
    duration: "Day 1–2",
  },
  {
    n: "03",
    icon: Palette,
    title: "Deposit & Direction",
    desc: "Love the preview? A simple deposit locks in your project. We then present a full design direction — typography, palette, layout, and animations — for your approval.",
    duration: "Day 2–5",
  },
  {
    n: "04",
    icon: Code2,
    title: "Build Phase",
    desc: "We build your site from scratch. 3D models are generated, scroll animations are wired in, product pages are crafted, and everything is tested across all devices.",
    duration: "Week 1–3",
  },
  {
    n: "05",
    icon: Rocket,
    title: "Final Payment & Launch",
    desc: "Site goes live and the remaining balance is due on delivery. Under Buy-Out you receive the full codebase and ownership. Under Renting we host and maintain it for you.",
    duration: "Final Day",
  },
];

export default function Process() {
  return (
    <section id="process" className="sec-dark py-24 border-t-2 border-[var(--line)]">
      <div className="max-w-5xl mx-auto px-5">
        {/* Section header bar */}
        <div className="flex items-center gap-4 mb-12 border-b-2 border-[var(--line)] pb-4">
          <span className="eyebrow">05 / Process</span>
          <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
          <span className="eyebrow text-[var(--muted)]">How It Works</span>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-3xl"
        >
          <h2 className="glow-acid display text-[clamp(2.2rem,5.5vw,4.5rem)] mb-5">
            From Call to{" "}
            <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2">Launch</span>
          </h2>
          <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed">
            A clear, 5-step pipeline designed to keep you informed and in control
            the entire way.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="hard lift bg-[var(--bg)] flex flex-col sm:flex-row"
            >
              {/* Number rail */}
              <div className="sm:w-44 flex-shrink-0 border-b-2 sm:border-b-0 sm:border-r-2 border-[var(--line)] p-5 flex sm:flex-col items-center sm:items-start justify-between gap-3">
                <span className="display text-5xl md:text-6xl text-[var(--acid)] leading-none">
                  {step.n}
                </span>
                <span className="mono text-[10px] font-bold uppercase tracking-[0.12em] border-2 border-[var(--line)] px-2 py-1">
                  {step.duration}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 flex-1">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 border-2 border-[var(--line)] grid place-items-center flex-shrink-0">
                    <step.icon size={16} />
                  </div>
                  <h3 className="text-lg font-extrabold uppercase tracking-tight">{step.title}</h3>
                </div>
                <p className="text-[var(--muted)] text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hard bg-[var(--bg)] mt-9 p-8 flex flex-col items-center text-center"
        >
          <p className="eyebrow text-[var(--muted)] mb-3">Ready to start your project?</p>
          <p className="text-xl md:text-2xl font-extrabold uppercase tracking-tight mb-7 max-w-xl">
            The first call is free. No commitment until the deposit.
          </p>
          <a href="#contact">
            <button className="btn-brut">
              Book a Discovery Call <ArrowRight size={16} />
            </button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
