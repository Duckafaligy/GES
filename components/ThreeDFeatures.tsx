"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Film, Workflow, type LucideIcon } from "lucide-react";
import ProductViewer from "./ProductViewer";

type Tab = {
  id: string;
  icon: LucideIcon;
  label: string;
  tier: string;
  tagline: string;
  description: string;
  tools: { name: string; role: string }[];
  features: string[];
  video?: string;
};

const tabs: Tab[] = [
  {
    id: "premium",
    icon: Cpu,
    label: "Premium 3D Model",
    tier: "Flagship Tier",
    tagline: "Hyper-Realistic • Lifelike • 360° Interactive",
    description:
      "Our next-gen rendering pipeline: hyper-realistic materials and lifelike lighting that make the product feel like you're holding it in person. Customers drag to spin it a full 360° right on the page — more interactive, more visually striking.",
    tools: [
      { name: "PBR Materials", role: "Physically-accurate surfaces" },
      { name: "Lifelike Light", role: "Realistic reflections & shadows" },
      { name: "High Fidelity", role: "Feels physically present" },
      { name: "WebGPU", role: "Hardware-accelerated render" },
    ],
    features: ["Hyper-realistic materials", "Lifelike lighting", "360° swipe rotation", "Feels physically real"],
    video: "/media/premium-360.mp4",
  },
  {
    id: "frames",
    icon: Film,
    label: "Landing Scroll Animation",
    tier: "Signature Build",
    tagline: "Scroll-Driven • Cinematic • Immersive",
    description:
      "A 360° product animation wired to your scroll position. We extract high-quality frames and tie them to the scroll, so the product rotates and explodes to reveal every part as visitors move down the page.",
    tools: [
      { name: "Frame Splitting", role: "High-quality frame extraction" },
      { name: "Scroll Scrub", role: "Frame tied to scroll position" },
      { name: "Canvas Render", role: "Buttery-smooth playback" },
      { name: "Part Callouts", role: "Labels reveal as it explodes" },
    ],
    features: ["Scroll-controlled rotation", "Up to 190+ frames", "Silky smooth interpolation", "Mobile swipe support"],
  },
  {
    id: "automation",
    icon: Workflow,
    label: "Workflows · Agents · Automation",
    tier: "New Capability",
    tagline: "AI Agents • Automated Workflows • Always-On",
    description:
      "Beyond the storefront, we build the systems that run behind it: custom AI agents and automated workflows that handle the repetitive work — wiring your tools, APIs, and data together so the business runs itself.",
    tools: [
      { name: "AI Agents", role: "Autonomous task handling" },
      { name: "Workflows", role: "Multi-step automation" },
      { name: "Integrations", role: "Connect your tools & APIs" },
      { name: "Human-in-Loop", role: "You stay in control" },
    ],
    features: ["Custom AI agents", "Workflow automation", "Tool & API integration", "Human-in-the-loop controls"],
  },
];

export default function ThreeDFeatures() {
  const [active, setActive] = useState("premium");
  const current = tabs.find((t) => t.id === active)!;
  const videoSrc = tabs.find((t) => t.video)?.video;

  return (
    <section id="3d-features" className="sec-dark py-24 border-t-2 border-[var(--line)]">
      <div className="max-w-7xl mx-auto px-5">
        {/* Section header bar */}
        <div className="flex items-center gap-4 mb-12 border-b-2 border-[var(--line)] pb-4">
          <span className="eyebrow">04 / 3D & Automation</span>
          <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
          <span className="eyebrow text-[var(--amber)]">Capabilities</span>
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
            Products That Feel{" "}
            <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2">Real Online</span>
          </h2>
          <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed">
            From hyper-realistic 360° models to cinematic scroll animations —
            plus the AI agents and automated workflows that run the business
            behind the storefront.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-3 mb-9">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`inline-flex items-center gap-2 mono text-xs font-bold uppercase tracking-[0.08em] px-4 py-2.5 border-2 border-[var(--line)] transition-all ${
                active === tab.id
                  ? "bg-[var(--acid)] text-[#0a0a0a] shadow-[4px_4px_0_var(--line)]"
                  : "bg-transparent text-[var(--fg)] hover:-translate-y-0.5"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid md:grid-cols-2 gap-9 items-start">
              {/* Left — detached text card */}
              <div className="hard bg-[var(--bg)] p-7 md:p-9">
                <div className="eyebrow text-[var(--muted)] mb-3">{current.tagline}</div>
                <h3 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight mb-3">
                  {current.label}
                </h3>
                <span className="inline-block mono text-sm font-bold bg-[var(--acid)] text-[#0a0a0a] px-2.5 py-1 mb-6">
                  {current.tier}
                </span>
                <p className="text-[var(--muted)] text-sm leading-relaxed mb-7">
                  {current.description}
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {current.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 border-2 border-[var(--line)] px-3 py-2 text-xs font-medium"
                    >
                      <span className="w-2 h-2 bg-[var(--acid)] border border-[var(--line)] flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — What You Get capability stack (shown on every tab) */}
              <div>
                <div className="eyebrow text-[var(--muted)] mb-4">What You Get</div>
                <div className="space-y-3">
                  {current.tools.map((tool, i) => (
                    <motion.div
                      key={tool.name}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center justify-between gap-4 border-2 border-[var(--line)] p-4"
                    >
                      <div>
                        <div className="font-extrabold uppercase text-sm tracking-tight">{tool.name}</div>
                        <div className="text-[var(--muted)] text-xs mt-0.5">{tool.role}</div>
                      </div>
                      <div className="w-9 h-9 border-2 border-[var(--line)] grid place-items-center mono font-bold text-sm flex-shrink-0">
                        {tool.name[0]}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom — live 360° turntable driven by pre-split frames. Mounted once
            so the preloaded frames stay cached across tab switches (no re-prepare);
            shown only while the tier that ships it is active. */}
        {videoSrc && (
          <div className={current.video ? "mt-9 pt-9 border-t-2 border-[var(--line)]" : "hidden"}>
            {/* The turntable frames are shot on a white studio backdrop, so on this
                dark section we frame it as a deliberate, contained product panel
                (hard border + offset shadow, capped width) rather than a full-bleed
                white bleed.
                184 = exactly one full revolution of the source clip; frames 185-192
                retrace the start, so we loop 1-184 for a seamless wrap. */}
            <div className="max-w-3xl mx-auto">
              <ProductViewer frameDir="/product-360" frameCount={184} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
