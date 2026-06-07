import type { Metadata } from "next";
import ServiceDetail, { type ServiceContent } from "@/components/ServiceDetail";

export const metadata: Metadata = {
  title: "Local Business Sites — GES",
  description:
    "Fast, mobile-first websites for local businesses — built to rank in local search and turn nearby visitors into bookings, calls, and walk-ins.",
};

const content: ServiceContent = {
  index: "01",
  eyebrow: "Local Business Sites",
  title: (
    <>
      Turn locals into{" "}
      <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2 -rotate-1">
        regulars
      </span>
      .
    </>
  ),
  lede:
    "For the restaurants, salons, clinics, trades and studios that live on their reputation. We build fast, mobile-first sites that show up in local search, earn trust on the first scroll, and turn a phone-in-hand visitor into a booking or a walk-in.",
  features: [
    {
      title: "Mobile-first build",
      body: "Designed for the phone first — where most local searches happen — with thumb-friendly navigation and instant loads.",
    },
    {
      title: "Local SEO foundation",
      body: "Google Business Profile, location pages, and schema markup so you surface when nearby customers search.",
    },
    {
      title: "Call, map & book",
      body: "One-tap calling, directions, hours, and embedded booking or reservation flows that remove every step before action.",
    },
    {
      title: "Reviews that sell",
      body: "Live Google reviews and social proof placed exactly where hesitation happens — right before the decision.",
    },
    {
      title: "Lightning performance",
      body: "Sub-second loads on real networks. Speed is the silent conversion lever, and a ranking factor too.",
    },
    {
      title: "Easy to update",
      body: "Change hours, menus, prices, or photos yourself — no developer and no waiting around.",
    },
  ],
  deliverables: [
    "Custom 3–6 page design",
    "Mobile, tablet & desktop layouts",
    "Google Business Profile setup",
    "On-page local SEO + schema",
    "Contact, booking & map integration",
    "Photo and copy polish",
    "Analytics & conversion tracking",
    "Launch QA + hosting guidance",
  ],
  demo: { href: "/#services", label: "See all services" },
};

export default function Page() {
  return <ServiceDetail content={content} />;
}
