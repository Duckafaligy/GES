import Link from "next/link";

export type LegalContent = {
  title: string;
  updated: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
};

export default function LegalDoc({ content }: { content: LegalContent }) {
  return (
    <>
      {/* ── Header ── */}
      <section className="sec-dark border-b-2 border-[var(--line)]">
        <div className="max-w-3xl mx-auto px-5 pt-36 sm:pt-44 pb-16">
          <div className="eyebrow text-[var(--muted)] flex flex-wrap items-center gap-2 mb-7">
            <Link href="/" className="ul-link">
              GES
            </Link>
            <span>/</span>
            <span>Legal</span>
            <span>/</span>
            <span className="text-[var(--fg)]">{content.title}</span>
          </div>
          <h1 className="display text-[clamp(2.4rem,7vw,5rem)]">{content.title}</h1>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--muted)] mt-6">
            Last updated · {content.updated}
          </p>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="sec-light py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-5">
          <p className="text-base text-[var(--fg)] leading-relaxed border-l-2 border-[var(--acid)] pl-4">
            {content.intro}
          </p>

          <div className="mt-12 space-y-12">
            {content.sections.map((s, i) => (
              <div key={s.heading}>
                <h2 className="flex items-baseline gap-3 text-xl font-black mb-4">
                  <span className="mono text-sm text-[var(--muted)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.heading}
                </h2>
                <div className="space-y-4 sm:pl-9">
                  {s.body.map((p, j) => (
                    <p key={j} className="text-sm text-[var(--muted)] leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bordered bg-[var(--bone)] p-6">
            <div className="eyebrow text-[var(--muted)] mb-2">Note</div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              This page is provided as a general template for informational
              purposes only and is not legal advice. Please consult a qualified
              legal professional before relying on it. Questions? Reach us through
              the{" "}
              <Link
                href="/#contact"
                className="ul-link text-[var(--fg)] font-semibold"
              >
                contact section
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
