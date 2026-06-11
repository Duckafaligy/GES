"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface CounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

function Counter({ end, suffix = "", prefix = "", duration = 2 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(end / (duration * 60));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const stats = [
  { n: "01", label: "Client Satisfaction", value: 100, suffix: "%", desc: "Every project delivered to spec" },
  { n: "02", label: "Technologies Mastered", value: 24, suffix: "+", desc: "From Three.js to WebGPU" },
  { n: "03", label: "Avg. Conversion Boost", value: 3, suffix: "×", desc: "vs generic template sites" },
  { n: "04", label: "Avg. Build Time", value: 21, suffix: " days", desc: "From deposit to live" },
];

export default function Stats() {
  return (
    <section className="sec-dark py-24 border-t-2 border-[var(--line)]">
      <div className="max-w-7xl mx-auto px-5">
        {/* Section header bar */}
        <div className="flex items-center gap-4 mb-12 border-b-2 border-[var(--line)] pb-4">
          <span className="eyebrow">06 / Receipts</span>
          <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
          <span className="eyebrow text-[var(--amber)]">The Numbers</span>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 max-w-3xl"
        >
          <h2 className="glow-amber display text-[clamp(2.2rem,5.5vw,4.5rem)]">
            The Numbers Speak{" "}
            <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2">
              For Themselves
            </span>
          </h2>
        </motion.div>

        {/* Stat cells */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t-2 border-l-2 border-[var(--line)]">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="border-b-2 border-r-2 border-[var(--line)] p-7"
            >
              <div className="mono text-xs font-bold mb-6 text-[var(--amber)]">{s.n}</div>
              <div className="display text-5xl md:text-6xl leading-none mb-3">
                <Counter end={s.value} suffix={s.suffix} duration={1.8} />
              </div>
              <div className="font-extrabold uppercase text-sm tracking-tight mb-1">
                {s.label}
              </div>
              <div className="text-[var(--muted)] text-xs">{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
