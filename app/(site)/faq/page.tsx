import type { Metadata } from "next";
import FaqDoc, { type FaqCategory } from "@/components/FaqDoc";

export const metadata: Metadata = {
  title: "FAQ — GES",
  description:
    "Straight answers on GES pricing, website ownership (buy-out vs rent), our build process and timeline, 3D product experiences, and how to get started.",
};

const categories: FaqCategory[] = [
  {
    title: "Pricing & Value",
    items: [
      {
        q: "How much does a website cost?",
        a: [
          "Our base package starts around $1,000 and covers everything a working e-commerce site needs: a landing page, product page(s), checkout, contact, and legal pages.",
          "From there it scales with scope — extra pages, per-product pages, 3D product models, and scroll animations. Most builds land roughly between $1,400 and $10,000+ depending on what you need.",
          "We don't hide the ball: we walk you through the exact number upfront on a free call, before you commit a cent.",
        ],
      },
      {
        q: "What's included in the base package?",
        a: [
          "A complete, functioning storefront: landing page, product page(s), checkout, contact page, and legal pages — designed and built from scratch, not from a template.",
        ],
      },
      {
        q: "How do payments work?",
        a: [
          "A 30% non-refundable deposit locks in your project and our schedule. The remaining balance is due when the site is complete and delivered.",
        ],
      },
      {
        q: "What do the add-ons cost?",
        a: [
          "Roughly: additional standard pages ~$25 each; product pages ~$50 per product (custom descriptions, reviews, gallery, interactivity); a landing-page 3D scroll animation ~$200 one-time; a 360° interactive 3D model ~$30 per product; and premium hyper-realistic 3D rendering ~$70 per product.",
          "These are indicative — your exact quote depends on the build and is confirmed on the call.",
        ],
      },
    ],
  },
  {
    title: "Ownership — Buy-out vs Rent",
    items: [
      {
        q: "Do I actually own the website?",
        a: [
          "That's your choice. With a flat buy-out you receive everything — the complete codebase, files, folders, and full ownership. Once transferred, the site is yours.",
          "With renting, the site stays under GES ownership and you pay a recurring fee to use it, without access to the code or infrastructure.",
        ],
      },
      {
        q: "What's the difference between buying and renting?",
        a: [
          "Buy-out: you own it outright, host it wherever you like, and we can optionally manage it for a separate fee.",
          "Rent: we host and maintain it, you pay monthly, and if you cancel we retain the right to take it down. Renting keeps your upfront cost low.",
        ],
      },
      {
        q: "If I rent, can I buy it later?",
        a: [
          "Yes — but rent payments don't accumulate toward a buy-out. If a renting client decides to purchase outright, the full buy-out price applies; prior rent doesn't discount it.",
        ],
      },
    ],
  },
  {
    title: "Process & Timeline",
    items: [
      {
        q: "How does working with GES actually go?",
        a: [
          "Simple: we have a discovery call → you receive a private access code → that code unlocks a tailored preview of the site we've built for your business → you pay a 30% deposit to proceed → we finish the build → final payment on delivery.",
          "You see real work for your business before committing.",
        ],
      },
      {
        q: "How long does a build take?",
        a: [
          "Most projects go from deposit to live in around two to three weeks, depending on scope (number of pages, products, and 3D work). We'll give you a firm timeline on the call.",
        ],
      },
      {
        q: "What's the access code and preview?",
        a: [
          "After your call we generate a unique access code. Enter it in the Client Portal and it unlocks a private, tailored preview of your site — so you can see exactly what you're getting before paying anything beyond the deposit.",
        ],
      },
    ],
  },
  {
    title: "3D, Tech & Beyond",
    items: [
      {
        q: "What are the 3D product experiences?",
        a: [
          "Two tiers. Standard ($30/product) is a 360° interactive display — customers drag to rotate and inspect from every angle. Premium ($70/product) is a next-gen, hyper-realistic render with lifelike materials and lighting that feels like holding the product.",
          "We also build scroll-driven, frame-by-frame 'explode' animations on landing pages.",
        ],
      },
      {
        q: "Do you build more than websites?",
        a: [
          "Yes. We build custom AI agents and automated workflows that run the work behind the storefront — wiring your tools, APIs, and data together so the business scales without adding headcount.",
        ],
      },
      {
        q: "Will my site work on mobile?",
        a: [
          "Always. Every build is responsive and tested across desktop, tablet, and mobile — including the 3D and scroll-driven elements.",
        ],
      },
    ],
  },
  {
    title: "Working Together",
    items: [
      {
        q: "Who do you work with, and where?",
        a: [
          "We're Canada-based and currently focused on Canadian businesses. You work directly with the people building your site — no agency layers, no account-manager telephone.",
        ],
      },
      {
        q: "How do I get started?",
        a: [
          "Book a free 30-minute discovery call. We learn your business and vision, then show you what we'd build. No obligation until you approve the design and pay the deposit.",
        ],
      },
    ],
  },
];

export default function Page() {
  return <FaqDoc categories={categories} />;
}
