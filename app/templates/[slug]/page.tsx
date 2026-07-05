import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplateBySlug, formatPrice } from "@/lib/templates";
import DemoGate from "./DemoGate";
import BuyButton from "./BuyButton";

export const dynamic = "force-dynamic";

export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let result: Awaited<ReturnType<typeof getTemplateBySlug>> = null;
  try {
    result = await getTemplateBySlug(slug);
  } catch {
    result = null;
  }
  if (!result) notFound();
  const { template: t, formats } = result;

  return (
    <div className="min-h-screen sec-light">
      <header className="border-b-2 border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
          <Link href="/templates" className="eyebrow ul-link">← All templates</Link>
          <Link href="/account" className="btn-ghost text-[11px] py-2 px-3">My Purchases</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-12 grid lg:grid-cols-2 gap-10">
        <div>
          <div className="eyebrow text-[var(--muted)] mb-2">{t.category ?? "Template"}</div>
          <h1 className="display text-[clamp(2rem,5vw,3.4rem)] mb-3">{t.title}</h1>
          <p className="text-[var(--muted)] text-base leading-relaxed mb-6">{t.description ?? t.tagline}</p>
          <DemoGate slug={t.slug} />
        </div>

        <div>
          <div className="hard bg-[var(--bg)] p-6">
            <div className="flex items-center justify-between mb-5 border-b-2 border-[var(--line)] pb-4">
              <span className="eyebrow text-[var(--muted)]">Choose a format</span>
              <span className="display text-2xl">
                {formatPrice(t.price_cents)}<span className="text-sm text-[var(--muted)]"> from</span>
              </span>
            </div>

            {formats.length === 0 ? (
              <p className="mono text-xs text-[var(--muted)]">Formats are being prepared — check back shortly.</p>
            ) : (
              <div className="space-y-3">
                {formats.map((f) => (
                  <div key={f.id} className="border-2 border-[var(--line)] p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-extrabold uppercase text-sm tracking-tight">{f.label}</div>
                      {f.license && <div className="text-[var(--muted)] text-xs mt-0.5">{f.license}</div>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="mono font-bold text-sm mb-1.5">{formatPrice(f.price_cents)}</div>
                      <BuyButton formatId={f.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mono text-[10px] text-[var(--muted)] mt-5 leading-relaxed">
              Secure Stripe checkout + instant download. Raw codebase = full source you own;
              Shopify = .zip / .liquid / .json theme.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
