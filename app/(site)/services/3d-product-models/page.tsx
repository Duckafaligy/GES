import type { Metadata } from "next";
import ServiceDetail, { type ServiceContent } from "@/components/ServiceDetail";

export const metadata: Metadata = {
  title: "3D Product Models — GES",
  description:
    "Interactive 360° viewers, scroll-driven animations, and real-time WebGL that let customers explore your product before they buy.",
};

const content: ServiceContent = {
  index: "03",
  eyebrow: "3D Product Models",
  title: (
    <>
      Let customers{" "}
      <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2 -rotate-1">
        hold it
      </span>{" "}
      before it ships.
    </>
  ),
  lede:
    "Interactive 360° viewers, scroll-driven exploded animations, and real-time 3D that make online products feel tangible — and dramatically lift confidence at the buy button.",
  features: [
    {
      title: "Interactive 360° viewers",
      body: "Drag-to-spin turntables that load instantly and run buttery-smooth on any device.",
    },
    {
      title: "Scroll-driven animation",
      body: "Apple-style sequences that assemble, explode, or reveal your product as the customer scrolls.",
    },
    {
      title: "Real-time WebGL",
      body: "True 3D models with lighting and materials, rendered live in the browser — no plugins.",
    },
    {
      title: "Configurators",
      body: "Let buyers swap colors, materials, and options and see the change instantly.",
    },
    {
      title: "AR-ready",
      body: "Export to view-in-your-room AR so customers can place the product in their own space.",
    },
    {
      title: "Optimized assets",
      body: "Compressed geometry and textures tuned so richness never costs you load time.",
    },
  ],
  deliverables: [
    "Photography to 3D pipeline",
    "360° turntable viewer",
    "One scroll-scrub hero animation",
    "Web-ready optimized assets",
    "Mobile + desktop tuning",
    "Optional AR export",
    "Embed on any page or platform",
    "Performance budget & QA",
  ],
  demo: { href: "/#3d-features", label: "Try the live demo" },
};

export default function Page() {
  return <ServiceDetail content={content} />;
}
