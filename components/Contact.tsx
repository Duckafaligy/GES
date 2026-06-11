"use client";

import { motion } from "framer-motion";
import { Mail, MessageCircle, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

export default function Contact() {
  return (
    <section id="contact" className="sec-light py-24 border-t-2 border-[var(--line)]">
      <div className="max-w-6xl mx-auto px-5">
        {/* Section header bar */}
        <div className="flex items-center gap-4 mb-12 border-b-2 border-[var(--line)] pb-4">
          <span className="eyebrow">06 / Contact</span>
          <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
          <span className="eyebrow text-[var(--muted)]">Get Started</span>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-3xl"
        >
          <h2 className="display text-[clamp(2.2rem,5.5vw,4.5rem)] mb-5">
            Ready to Save Your{" "}
            <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2">
              E-Commerce?
            </span>
          </h2>
          <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed">
            Reach out and we&apos;ll schedule a discovery call. The first conversation is
            completely free — no obligations until you approve the design and pay the deposit.
          </p>
        </motion.div>

        {/* Contact cards */}
        <div className="grid md:grid-cols-2 gap-7 mb-7">
          <motion.a
            href="mailto:contact@ges.ca"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="hard lift bg-[var(--bg)] p-7 flex items-center gap-5 group"
          >
            <div className="w-12 h-12 border-2 border-[var(--line)] grid place-items-center flex-shrink-0">
              <Mail size={20} />
            </div>
            <div className="flex-1">
              <div className="font-extrabold uppercase text-sm tracking-tight mb-0.5">Email Us</div>
              <div className="mono text-sm">contact@ges.ca</div>
              <div className="text-[var(--muted)] text-xs mt-1">Typically reply within 24 hours</div>
            </div>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </motion.a>

          <motion.button
            type="button"
            onClick={() => window.dispatchEvent(new Event("ges:book"))}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hard lift bg-[var(--bg)] p-7 flex items-center gap-5 text-left group w-full"
          >
            <div className="w-12 h-12 border-2 border-[var(--line)] grid place-items-center flex-shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1">
              <div className="font-extrabold uppercase text-sm tracking-tight mb-0.5">Book a Discovery Call</div>
              <div className="mono text-sm">30-min free consultation</div>
              <div className="text-[var(--muted)] text-xs mt-1">Pick a time — zero pressure</div>
            </div>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </motion.button>
        </div>

        {/* Client Portal CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="hard bg-[var(--acid)] text-[#0a0a0a] p-9 md:p-11 flex flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Lock size={14} />
            <span className="eyebrow">Already Took Our Call?</span>
          </div>
          <h3 className="display text-2xl md:text-4xl mb-3">Access Your Preview</h3>
          <p className="text-[#0a0a0a]/70 text-sm md:text-base mb-7 max-w-md leading-relaxed">
            If you&apos;ve received a client access code from us during a call, use it to
            unlock your personalized website preview.
          </p>
          <Link href="/login">
            <button className="inline-flex items-center gap-2 bg-[#0a0a0a] text-[var(--acid)] mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-4 border-2 border-[#0a0a0a] hover:gap-3.5 transition-all">
              Enter Client Portal <ArrowRight size={15} />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
