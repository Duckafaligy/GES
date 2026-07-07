import type { Metadata } from "next";
import LegalDoc, { type LegalContent } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Accessibility — GES",
  description:
    "GES (Global E-Commerce Saviours) is committed to building accessible websites and an accessible web presence for everyone.",
};

const content: LegalContent = {
  title: "Accessibility",
  updated: "June 7, 2026",
  intro:
    "GES (Global E-Commerce Saviours) is committed to making the web work for everyone. We design and build with accessibility in mind, and we hold our own website to the same standard.",
  sections: [
    {
      heading: "Our commitment",
      body: [
        "We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and to align with the Accessibility for Ontarians with Disabilities Act (AODA). Accessibility is part of how we build — not an afterthought.",
      ],
    },
    {
      heading: "What we do",
      body: [
        "We build with semantic HTML, clear heading structure, keyboard-navigable controls, visible focus states, sufficient colour contrast, descriptive alt text, and support for reduced-motion preferences.",
        "We test across screen sizes and assistive technologies, and we treat accessibility issues as bugs to be fixed.",
      ],
    },
    {
      heading: "Ongoing effort",
      body: [
        "Accessibility is never 'done.' We review and improve our site over time, and we welcome feedback that helps us do better.",
      ],
    },
    {
      heading: "Need something in another format?",
      body: [
        "If any part of this site is difficult to use, or you need information in an alternative format, please get in touch and we will work with you to provide it.",
      ],
    },
    {
      heading: "Contact",
      body: [
        "Accessibility feedback or requests can be sent to us through the contact section of this site. We aim to respond within a few business days.",
      ],
    },
  ],
};

export default function Page() {
  return <LegalDoc content={content} />;
}
