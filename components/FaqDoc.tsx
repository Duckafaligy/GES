"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ArrowRight } from "lucide-react";

export type FaqCategory = {
  title: string;
  items: { q: string; a: string[] }[];
};

export default function FaqDoc({ categories }: { categories: FaqCategory[] }) {
  const total = categories.reduce((n, c) => n + c.items.length, 0);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      {/* ── Header ── */}
      <section className="sec-dark border-b-2 border-[var(--line)] grid-lines">
        <div className="max-w-4xl mx-auto px-5 pt-36 sm:pt-44 pb-16">
          <div className="eyebrow text-[var(--muted)] flex flex-wrap items-center gap-2 mb-7">
            <Link href="/" className="ul-link">GES</Link>
            <span>/</span>
            <span>Resources</span>
            <span>/</span>
            <span className="text-[var(--fg)]">FAQ</span>
          </div>
          <h1 className="glow-acid display text-[clamp(2.6rem,8vw,6rem)]">
            Questions,<br />
            <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2 -rotate-1">Answered</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--muted)] leading-relaxed mt-7 max-w-2xl">
            Everything on pricing, ownership, our process, and the tech — straight,
            no fluff. Can&apos;t find it? Book a free call and just ask.
          </p>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--muted)] mt-6">
            {total} answers · {categories.length} topics
          </p>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="sec-light py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-5 space-y-16">
          {categories.map((cat, ci) => (
            <div key={cat.title}>
              <div className="flex items-center gap-4 mb-6 border-b-2 border-[var(--line)] pb-3">
                <span className="mono text-sm text-[var(--amber-deep)]">{String(ci + 1).padStart(2, "0")}</span>
                <h2 className="font-black uppercase tracking-tight text-lg">{cat.title}</h2>
              </div>
              <div className="space-y-3">
                {cat.items.map((item, ii) => {
                  const id = `${ci}-${ii}`;
                  const isOpen = open === id;
                  return (
                    <div key={id} className={`bordered bg-[var(--bg)] transition-shadow ${isOpen ? "shadow-[5px_5px_0_0_var(--line)]" : ""}`}>
                      <button
                        onClick={() => setOpen(isOpen ? null : id)}
                        className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
                        aria-expanded={isOpen}
                      >
                        <span className="font-bold text-sm md:text-base pr-2">{item.q}</span>
                        <span className="flex-shrink-0 w-7 h-7 grid place-items-center border-2 border-[var(--line)]">
                          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-0 space-y-3 border-t-2 border-[var(--line)]/15">
                              {item.a.map((p, j) => (
                                <p key={j} className="text-sm text-[var(--muted)] leading-relaxed mt-3 first:mt-3">{p}</p>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CTA */}
          <div className="hard bg-[var(--acid)] text-[#0a0a0a] p-8 md:p-11 flex flex-col items-center text-center">
            <div className="eyebrow mb-3">Still curious?</div>
            <h3 className="display text-2xl md:text-4xl mb-4">Ask Us On A Free Call</h3>
            <p className="text-[#0a0a0a]/70 text-sm md:text-base mb-7 max-w-md leading-relaxed">
              Thirty minutes, zero pressure. We learn your business and answer
              anything — pricing, scope, timeline.
            </p>
            <Link href="/#book" className="inline-flex items-center gap-2 bg-[#0a0a0a] text-[var(--acid)] mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-4 border-2 border-[#0a0a0a] hover:gap-3.5 transition-all">
              Book a discovery call <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
