"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Box, Workflow, ArrowRight } from "lucide-react";

const services = [
  {
    icon: ShoppingBag,
    title: "E-Commerce Websites",
    badge: "Primary Focus",
    primary: true,
    description:
      "Our specialty. Full-build commerce for product brands — aesthetically superior and conversion-optimized. CAD/3D modelling animations, scroll-triggered product reveals, and hyper-realistic rendering across a complete storefront.",
    features: [
      "Landing, product & checkout",
      "Contact & legal pages",
      "CAD / 3D scroll animations",
      "Hyper-realistic product render",
      "Payment integration",
      "Mobile-first & SEO",
    ],
    value: "Built To Convert",
  },
  {
    icon: Box,
    title: "3D Product Experiences",
    badge: "Premium",
    primary: false,
    description:
      "The edge most agencies simply can't match. From 360° interactive models customers can rotate and inspect, to next-gen hyper-realistic rendering that feels like holding the product in person.",
    features: [
      "360° interactive display",
      "Lightweight 3D models (GLB)",
      "Hyper-realistic rendering",
      "Frame-by-frame scroll reveals",
      "Rotate & inspect on any device",
      "Mobile touch controls",
    ],
    value: "The Visual Edge",
  },
  {
    icon: Workflow,
    title: "Agents, Workflows & Automation",
    badge: "Now Building",
    primary: false,
    description:
      "The systems that run behind the storefront. Custom AI agents and automated workflows that handle the repetitive work — wiring your tools, APIs, and data together so the business scales without adding headcount.",
    features: [
      "Custom AI agents",
      "Workflow automation",
      "Tool & API integration",
      "Data & document pipelines",
      "Always-on background tasks",
      "Human-in-the-loop controls",
    ],
    value: "Scale Without Headcount",
  },
];

export default function Services() {
  return (
    <section id="services" className="sec-light py-24 border-t-2 border-[var(--line)]">
      <div className="max-w-7xl mx-auto px-5">
        {/* Section header bar */}
        <div className="flex items-center gap-4 mb-12 border-b-2 border-[var(--line)] pb-4">
          <span className="eyebrow">02 / Services</span>
          <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
          <span className="eyebrow text-[var(--amber-deep)]">What We Build</span>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 max-w-3xl"
        >
          <h2 className="display text-[clamp(2.2rem,5.5vw,4.5rem)] mb-5">
            Websites That{" "}
            <span className="inline-block bg-[var(--acid)] px-2">Actually Work</span>
          </h2>
          <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed">
            We don&apos;t sell templates. Better UI, better visuals, better
            conversions — every build is made from scratch to reflect your brand
            and move product, plus the AI agents and automation that run the
            work behind it.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-7">
          {services.map((svc, i) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              className="hard lift bg-[var(--bg)] p-7 flex flex-col"
            >
              {/* Top row: index + badge */}
              <div className="flex items-start justify-between mb-6">
                <span className="display text-5xl leading-none opacity-[0.12]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`mono text-[10px] font-bold uppercase tracking-[0.15em] border-2 border-[var(--line)] px-2.5 py-1 ${
                    svc.primary
                      ? "bg-[var(--acid)] text-[#0a0a0a]"
                      : "bg-transparent text-[var(--fg)]"
                  }`}
                >
                  {svc.badge}
                </span>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 border-2 border-[var(--line)] grid place-items-center mb-5">
                <svc.icon size={22} />
              </div>

              <h3 className="text-xl font-extrabold uppercase tracking-tight mb-3">
                {svc.title}
              </h3>
              <p className="text-[var(--muted)] text-sm leading-relaxed mb-6">
                {svc.description}
              </p>

              {/* Features */}
              <ul className="space-y-2.5 mb-7">
                {svc.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 bg-[var(--acid)] border border-[var(--line)] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Value row */}
              <div className="mt-auto flex items-center justify-between border-t-2 border-[var(--line)] pt-4">
                <span className="eyebrow text-[var(--muted)]">{svc.value}</span>
                <a
                  href="#ownership"
                  className="eyebrow ul-link flex items-center gap-1.5"
                >
                  Learn More <ArrowRight size={12} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
