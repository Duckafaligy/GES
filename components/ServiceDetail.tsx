import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

export type ServiceContent = {
  index: string;
  eyebrow: string;
  title: ReactNode;
  lede: string;
  features: { title: string; body: string }[];
  deliverables: string[];
  demo?: { href: string; label: string };
};

export default function ServiceDetail({ content }: { content: ServiceContent }) {
  return (
    <>
      {/* ── Hero ── */}
      <section className="sec-dark relative overflow-hidden border-b-2 border-[var(--line)]">
        <div className="absolute inset-0 grid-lines opacity-[0.12] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-5 pt-36 sm:pt-44 pb-20">
          <div className="eyebrow text-[var(--muted)] flex flex-wrap items-center gap-2 mb-7">
            <Link href="/" className="ul-link">
              GES
            </Link>
            <span>/</span>
            <span>Services</span>
            <span>/</span>
            <span className="text-[var(--fg)]">{content.eyebrow}</span>
          </div>
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="mono text-[var(--acid)] text-sm font-bold pt-2 sm:pt-3">
              ({content.index})
            </span>
            <h1 className="display text-[clamp(2.4rem,7vw,5.5rem)] max-w-4xl">
              {content.title}
            </h1>
          </div>
          <p className="text-base md:text-lg text-[var(--muted)] leading-relaxed max-w-2xl mt-8">
            {content.lede}
          </p>
          <div className="flex flex-wrap gap-4 mt-10">
            <Link href="/#contact">
              <button className="btn-brut">
                Book a Meeting <ArrowRight size={16} />
              </button>
            </Link>
            {content.demo && (
              <Link href={content.demo.href}>
                <button className="btn-ghost">
                  {content.demo.label} <ArrowUpRight size={16} />
                </button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="sec-light py-20 sm:py-24 border-b-2 border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-5">
          <div className="eyebrow text-[var(--muted)] mb-10">What you get</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.features.map((f, i) => (
              <div key={f.title} className="bordered lift bg-[var(--paper)] p-6">
                <div className="mono text-xs text-[var(--muted)] mb-3">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-black text-lg mb-2 leading-tight">{f.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deliverables ── */}
      <section className="sec-bone py-20 sm:py-24 border-b-2 border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-5 grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16">
          <div>
            <div className="eyebrow text-[var(--muted)] mb-4">Deliverables</div>
            <h2 className="display text-3xl sm:text-4xl leading-[0.95]">
              Everything ships
              <br />
              ready to grow.
            </h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {content.deliverables.map((d) => (
              <li
                key={d}
                className="flex items-start gap-3 border-b-2 border-[var(--line)] pb-4"
              >
                <span className="grid place-items-center w-5 h-5 bg-[var(--acid)] text-[#0a0a0a] flex-shrink-0 mt-0.5">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="text-sm leading-relaxed">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="sec-dark py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <h2 className="display text-[clamp(2rem,6vw,4.5rem)] max-w-3xl">
            Build the version
            <br />
            your competitors fear.
          </h2>
          <Link href="/#contact" className="shrink-0">
            <button className="btn-brut">
              Book a Meeting <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>
    </>
  );
}
