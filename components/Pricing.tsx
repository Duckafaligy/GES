"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  X,
  Crown,
  Building2,
  ShieldCheck,
  TrendingUp,
  Globe,
  ArrowRight,
  Lock,
} from "lucide-react";

const models = [
  {
    id: "buyout",
    icon: Crown,
    title: "Model #1 — Buy-Out",
    tagline: "Full Ownership Transfer",
    pros: [
      "Full codebase ownership",
      "All files, folders & secrets transferred",
      "One-time — no monthly fees",
      "Optional management support",
      "Deploy anywhere you want",
    ],
    cons: ["Higher upfront commitment", "You manage hosting & updates"],
    description:
      "You own the website in full and receive everything — the complete codebase, all files, folders, and secrets. Once transferred, it's yours: a real business asset. We can optionally manage it for you.",
  },
  {
    id: "rental",
    icon: Building2,
    title: "Model #2 — Renting",
    tagline: "We Host. You Grow.",
    pros: [
      "Lower entry — pay monthly",
      "We handle hosting & maintenance",
      "Fast launch with full support",
      "Want to own it later? Buy-out available",
    ],
    cons: [
      "No code, files or infrastructure access",
      "Cancel and we retain the right to take it down",
      "Rent does not accumulate toward a buy-out",
    ],
    description:
      "The website stays under GES ownership. You pay a recurring fee to use it, and we keep it running. Decide to own it down the line and a buy-out is always on the table.",
  },
];

const advantages = [
  {
    icon: TrendingUp,
    title: "Engineered To Convert",
    desc: "Every build is conversion-first — interactive 3D, scroll-driven storytelling and fast, clean UX that turns browsers into buyers.",
  },
  {
    icon: ShieldCheck,
    title: "Yours To Keep",
    desc: "Buy out and own the full codebase outright, or rent while we host. Either way — no lock-in games, no surprise fees.",
  },
  {
    icon: Globe,
    title: "Direct & Canadian",
    desc: "You work straight with the builders. Fast, domestic and straightforward — no agency layers, no account-manager telephone.",
  },
];

export default function Pricing() {
  return (
    <section id="ownership" className="sec-dark py-24 border-t-2 border-[var(--line)]">
      <div className="max-w-7xl mx-auto px-5">
        {/* Section header bar */}
        <div className="flex items-center gap-4 mb-12 border-b-2 border-[var(--line)] pb-4">
          <span className="eyebrow">03 / Ownership</span>
          <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
          <span className="eyebrow text-[var(--muted)]">Your Asset</span>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 max-w-3xl"
        >
          <h2 className="glow-acid display text-[clamp(2.2rem,5.5vw,4.5rem)] mb-5">
            Own The Edge,{" "}
            <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2">
              Not Just A Site
            </span>
          </h2>
          <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed">
            Most agencies hand you a rental you never really control. We give you
            a choice: own your site outright as a genuine business asset, or let
            us host and grow it for you. The edge is yours either way.
          </p>
        </motion.div>

        {/* Advantages strip */}
        <div className="grid md:grid-cols-3 gap-7 mb-12">
          {advantages.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="hard bg-[var(--bg)] p-6"
            >
              <div className="w-11 h-11 border-2 border-[var(--line)] grid place-items-center mb-4">
                <a.icon size={18} />
              </div>
              <h3 className="font-extrabold uppercase text-base tracking-tight mb-2">
                {a.title}
              </h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed">{a.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Ownership Models */}
        <div className="grid md:grid-cols-2 gap-7 mb-7">
          {models.map((model, i) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="hard lift bg-[var(--bg)] p-8"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 border-2 border-[var(--line)] grid place-items-center">
                  <model.icon size={20} />
                </div>
                <span className="eyebrow text-[var(--muted)]">{model.tagline}</span>
              </div>
              <h3 className="text-2xl font-extrabold uppercase tracking-tight mb-3">
                {model.title}
              </h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed mb-6">
                {model.description}
              </p>

              <div className="grid grid-cols-2 gap-5 border-t-2 border-[var(--line)] pt-5">
                <div>
                  <div className="eyebrow mb-3">Included</div>
                  <ul className="space-y-2.5">
                    {model.pros.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm">
                        <Check size={13} className="mt-0.5 flex-shrink-0 text-[var(--acid)]" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="eyebrow mb-3 text-[var(--muted)]">Trade-Offs</div>
                  <ul className="space-y-2.5">
                    {model.cons.map((c) => (
                      <li key={c} className="flex items-start gap-2.5 text-sm text-[var(--muted)]">
                        <X size={13} className="mt-0.5 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Investment → portal banner (no public price list — numbers live in the client portal) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="hard bg-[var(--bg)] p-7 md:p-9 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="max-w-xl">
            <div className="eyebrow text-[var(--muted)] mb-2 flex items-center gap-2">
              <Lock size={12} /> Your Investment
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight mb-2">
              Scoped To You — Not A Public Price List
            </h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed">
              Every project is priced to your exact scope. We map it out on a call
              and your number lands in your own private client portal — clear,
              itemized, and yours alone.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 flex-shrink-0">
            <a href="#contact">
              <button className="btn-brut">
                Book a Meeting <ArrowRight size={16} />
              </button>
            </a>
            <Link href="/login">
              <button className="btn-ghost">
                <Lock size={14} /> Client Portal
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
