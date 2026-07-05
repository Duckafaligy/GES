import Link from "next/link";
import { listPublishedTemplates, formatPrice } from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function StorefrontPage() {
  let templates: Awaited<ReturnType<typeof listPublishedTemplates>> = [];
  try {
    templates = await listPublishedTemplates();
  } catch {
    templates = [];
  }

  return (
    <div className="min-h-screen sec-light">
      <header className="border-b-2 border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--acid)] text-[#0a0a0a] grid place-items-center font-black border-2 border-[var(--line)]">G</div>
            <div className="leading-tight">
              <div className="font-extrabold uppercase tracking-tight text-sm">GES Templates</div>
              <div className="eyebrow text-[var(--muted)]">Website templates for sale</div>
            </div>
          </Link>
          <Link href="/account" className="btn-ghost text-[11px] py-2 px-3">My Purchases</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-12">
        <div className="mb-10 max-w-2xl">
          <h1 className="display text-[clamp(2.2rem,6vw,4rem)] mb-4">
            Templates that <span className="inline-block bg-[var(--acid)] px-2">ship</span>
          </h1>
          <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed">
            Production-ready website templates. Try a live demo, then buy the format you need —
            raw codebase, Shopify, or plain HTML.
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="hard p-10 text-center">
            <div className="eyebrow text-[var(--muted)] mb-2">No templates yet</div>
            <p className="text-sm text-[var(--muted)]">
              Run <span className="mono">supabase/marketplace.sql</span> and add your Supabase keys, then templates appear here.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {templates.map((t) => (
              <Link key={t.id} href={`/templates/${t.slug}`} className="hard lift bg-[var(--bg)] flex flex-col group">
                <div className="aspect-[16/10] border-b-2 border-[var(--line)] overflow-hidden bg-[var(--bone)] relative">
                  {t.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.thumbnail_url} alt={t.title} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="absolute inset-0 grid place-items-center"
                      style={{ background: "repeating-linear-gradient(45deg, color-mix(in srgb, var(--line) 8%, transparent) 0 2px, transparent 2px 16px)" }}
                    >
                      <span className="display text-4xl opacity-25">{t.title}</span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="eyebrow text-[var(--muted)]">{t.category ?? "Template"}</span>
                    <span className="mono font-bold text-sm">{formatPrice(t.price_cents)}</span>
                  </div>
                  <h3 className="text-xl font-extrabold uppercase tracking-tight mb-1.5">{t.title}</h3>
                  <p className="text-[var(--muted)] text-sm leading-relaxed flex-1">{t.tagline}</p>
                  <span className="eyebrow ul-link mt-4 inline-flex items-center gap-1.5">View &amp; try →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
