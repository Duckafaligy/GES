import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Shared shell for standalone content pages (footer Services + Legal links).
// The nav is forced into its solid state so it stays readable over the light
// page backgrounds, and the Footer lets visitors keep navigating the site.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation forceSolid />
      <main>{children}</main>
      <Footer />
    </>
  );
}
