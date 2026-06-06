import Link from "next/link";

const links = {
  Services: ["Local Business Sites", "E-Commerce Websites", "3D Product Models"],
  Company: ["Ownership", "Our Process", "Client Portal"],
  Legal: ["Privacy Policy", "Terms of Service"],
};

export default function Footer() {
  return (
    <footer className="sec-dark border-t-2 border-[var(--line)]">
      {/* Big wordmark */}
      <div className="max-w-7xl mx-auto px-5 pt-16 pb-10 border-b-2 border-[var(--line)]">
        <div className="display text-[clamp(3.5rem,18vw,12rem)] leading-[0.82] text-[var(--acid)] select-none">
          GES
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-5">
          <p className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] max-w-md leading-relaxed">
            Global E-Commerce Saviours — world-class websites for businesses that
            deserve more than a template.
          </p>
          <div className="mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)] whitespace-nowrap">
            Based in Canada 🇨🇦
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="max-w-7xl mx-auto px-5 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-[var(--line)] grid place-items-center bg-[var(--acid)] text-[#0a0a0a] font-black text-lg flex-shrink-0">
              G
            </div>
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)] leading-snug">
              GES
              <br />
              Global E-Commerce
            </div>
          </div>
        </div>

        {Object.entries(links).map(([heading, items]) => (
          <div key={heading}>
            <div className="eyebrow text-[var(--muted)] mb-4">{heading}</div>
            <ul className="space-y-2.5">
              {items.map((item) => (
                <li key={item}>
                  <span className="text-sm text-[var(--fg)] ul-link cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t-2 border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-5 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="mono text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} GES — Global E-Commerce Saviours. All rights reserved.
          </p>
          <Link href="/login">
            <span className="eyebrow ul-link flex items-center gap-1.5">
              Client Portal →
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
