import type { Metadata } from "next";
import ServiceDetail, { type ServiceContent } from "@/components/ServiceDetail";

export const metadata: Metadata = {
  title: "E-Commerce Websites — GES",
  description:
    "Conversion-first online stores — persuasive product pages, frictionless checkout, secure payments, and analytics wired to sell around the clock.",
};

const content: ServiceContent = {
  index: "02",
  eyebrow: "E-Commerce Websites",
  title: (
    <>
      Storefronts built to{" "}
      <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2 -rotate-1">
        sell
      </span>
      .
    </>
  ),
  lede:
    "Full storefronts engineered to sell — not just to look good. From product pages that answer every objection to a checkout that gets out of the way, we build conversion-first stores that move product around the clock.",
  features: [
    {
      title: "Conversion-first pages",
      body: "Galleries, specs, trust badges, and persuasive copy structured to turn browsers into buyers.",
    },
    {
      title: "Frictionless checkout",
      body: "Fewer steps, saved details, and wallet payments — the line between a sale and an abandoned cart.",
    },
    {
      title: "Secure payments",
      body: "Stripe and Shopify-grade processing with cards, wallets, and buy-now-pay-later built in.",
    },
    {
      title: "Inventory & orders",
      body: "Real-time stock, variants, automated order emails, and a dashboard you actually understand.",
    },
    {
      title: "Built to scale",
      body: "Architecture that stays fast from your first ten orders to your ten-thousandth.",
    },
    {
      title: "Analytics & retargeting",
      body: "Pixels, events, and funnels wired up so every dollar of ad spend is measurable.",
    },
  ],
  deliverables: [
    "Custom storefront design",
    "Up to 50 products set up",
    "Cart + secure checkout",
    "Payment, tax & shipping config",
    "Inventory management",
    "Order & customer emails",
    "SEO, analytics & pixels",
    "Cross-device launch QA",
  ],
  demo: { href: "/services/3d-product-models", label: "Add 3D product models" },
};

export default function Page() {
  return <ServiceDetail content={content} />;
}
