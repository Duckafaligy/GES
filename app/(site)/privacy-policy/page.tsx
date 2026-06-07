import type { Metadata } from "next";
import LegalDoc, { type LegalContent } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy Policy — GES",
  description:
    "How GES (Global E-Commerce Saviours) collects, uses, and protects your information.",
};

const content: LegalContent = {
  title: "Privacy Policy",
  updated: "June 7, 2026",
  intro:
    "GES (Global E-Commerce Saviours) respects your privacy. This policy explains what information we collect when you visit our website or work with us, how we use it, and the choices you have.",
  sections: [
    {
      heading: "Information we collect",
      body: [
        "When you contact us or book a call, we collect details you provide directly — such as your name, email address, phone number, business name, and any project information you share.",
        "When you browse the site, we automatically collect limited technical data such as your IP address, browser type, device, and pages visited, through cookies and analytics tools.",
      ],
    },
    {
      heading: "How we use your information",
      body: [
        "To respond to enquiries, schedule consultations, and provide our design and development services.",
        "To operate, maintain, and improve our website and offerings.",
        "To send project updates and, where you have opted in, occasional company news. You can unsubscribe at any time.",
      ],
    },
    {
      heading: "Cookies & analytics",
      body: [
        "We use first-party, privacy-respecting analytics to understand how visitors use the site. You can disable cookies in your browser settings, though some features may not function as intended if you do.",
      ],
    },
    {
      heading: "Sharing your information",
      body: [
        "We do not sell your personal information. We share it only with trusted service providers — such as hosting, analytics, and payment processors — who help us operate, and only to the extent necessary. We may also disclose information where required by law.",
      ],
    },
    {
      heading: "Data retention",
      body: [
        "We keep personal information only as long as needed to provide our services and meet legal obligations, after which it is securely deleted or anonymized.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Depending on your location, you may have the right to access, correct, delete, or restrict the use of your personal information, and to withdraw consent. To exercise these rights, contact us using the details below.",
      ],
    },
    {
      heading: "Security",
      body: [
        "We use reasonable technical and organizational measures to protect your information. No method of transmission over the internet is completely secure, but we work hard to safeguard your data.",
      ],
    },
    {
      heading: "Contact",
      body: [
        "Questions about this policy or your data can be sent to us through the contact section of this site. GES is based in Canada and operates in line with applicable Canadian privacy law (PIPEDA).",
      ],
    },
  ],
};

export default function Page() {
  return <LegalDoc content={content} />;
}
