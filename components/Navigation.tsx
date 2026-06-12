"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "Ownership", href: "#ownership" },
  { label: "3D", href: "#3d-features" },
  { label: "Process", href: "#process" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];

const tickerItems = [
  "GLOBAL E-COMMERCE SAVIOURS",
  "WE BUILD · YOU GROW",
  "BUILD — CONVERT — OWN",
  "MADE IN CANADA",
];

export default function Navigation({ forceSolid = false }: { forceSolid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // The bar is transparent (white text) over the dark hero sections on the home
  // page, but content sub-pages have light backgrounds — force the solid bar
  // there so the logo and links stay readable from the very top.
  const solid = forceSolid || scrolled;

  // Logo always points home. If we're already on the home page, intercept the
  // click and smooth-scroll back up to the first section instead of a no-op nav.
  const handleLogoClick = (e: React.MouseEvent) => {
    setOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Stay transparent (black, light text) across the two dark hero sections —
  // VideoHero + the tall BikeShowcase. Only switch to the solid bar once the
  // showcase (#showcase) has scrolled up behind the fixed nav, i.e. the visible
  // viewport is now the light Services section and everything after it.
  useEffect(() => {
    const onScroll = () => {
      const showcase = document.getElementById("showcase");
      const navH = navRef.current?.offsetHeight ?? 92;
      if (showcase) {
        setScrolled(showcase.getBoundingClientRect().bottom <= navH);
      } else {
        setScrolled(window.scrollY > 60); // fallback if the section isn't present
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav ref={navRef} className="entry-nav fixed top-0 left-0 right-0 z-50">
      {/* ── Acid ticker strip ── */}
      <div className="marquee h-7 items-center bg-[var(--acid)] text-[#0a0a0a] border-b-2 border-[#0a0a0a]">
        {[0, 1].map((k) => (
          <div key={k} className="marquee-track items-center" aria-hidden={k === 1}>
            {Array.from({ length: 3 }).flatMap((_, r) =>
              tickerItems.map((t) => (
                <span
                  key={`${k}-${r}-${t}`}
                  className="mono text-[10px] font-bold tracking-[0.18em] px-5"
                >
                  {t} <span className="opacity-50">✦</span>
                </span>
              ))
            )}
          </div>
        ))}
      </div>

      {/* ── Nav row ── */}
      <div
        className={`transition-colors duration-300 ${
          solid
            ? "bg-[var(--paper)] text-[#0a0a0a] border-b-2 border-[#0a0a0a]"
            : "bg-transparent text-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 bg-[var(--acid)] text-[#0a0a0a] border-2 border-current font-black text-lg leading-none">
              G
            </span>
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-black text-base tracking-tight">GES</span>
              <span className="mono text-[8px] tracking-[0.2em] uppercase opacity-70 mt-0.5">
                Global E-Commerce Saviours
              </span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="ul-link mono text-xs font-bold uppercase tracking-[0.12em] hover:text-[var(--acid)] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <Link
              href="/login"
              className={`inline-flex items-center mono text-xs font-bold uppercase tracking-[0.08em] border-2 px-4 py-2 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 ${
                solid
                  ? "bg-[#0a0a0a] text-white border-[#0a0a0a] shadow-[4px_4px_0_#0a0a0a] hover:shadow-[6px_6px_0_#0a0a0a] active:shadow-[1px_1px_0_#0a0a0a]"
                  : "bg-white text-[#0a0a0a] border-white shadow-[4px_4px_0_rgba(255,255,255,0.4)] hover:shadow-[6px_6px_0_rgba(255,255,255,0.4)] active:shadow-[1px_1px_0_rgba(255,255,255,0.4)]"
              }`}
            >
              Client Portal
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden grid place-items-center w-9 h-9 border-2 border-current"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="md:hidden overflow-hidden bg-[var(--paper)] text-[#0a0a0a] border-b-2 border-[#0a0a0a]"
          >
            <div className="px-5 py-4 flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="mono text-sm font-bold uppercase tracking-[0.1em] py-3 border-b border-[#0a0a0a]/15 hover:text-[var(--acid-deep)]"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-4 text-center mono text-sm font-bold uppercase tracking-[0.08em] bg-[#0a0a0a] text-white border-2 border-[#0a0a0a] py-3 shadow-[4px_4px_0_#0a0a0a]"
              >
                Client Portal →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
