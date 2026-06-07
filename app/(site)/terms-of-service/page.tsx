import type { Metadata } from "next";
import LegalDoc, { type LegalContent } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Terms of Service — GES",
  description:
    "The terms that govern use of the GES website and our design and development services.",
};

const content: LegalContent = {
  title: "Terms of Service",
  updated: "June 7, 2026",
  intro:
    "These terms govern your use of the GES website and the design and development services we provide. By using our site or engaging us for a project, you agree to these terms.",
  sections: [
    {
      heading: "Services",
      body: [
        "GES provides website design, development, e-commerce, and 3D product modeling services. The scope, deliverables, timeline, and price for any engagement are defined in a separate written proposal or agreement.",
      ],
    },
    {
      heading: "Proposals & payment",
      body: [
        "Project pricing and payment schedules are set out in your proposal. Unless stated otherwise, a deposit is required to begin work, with remaining balances due at the milestones described there.",
        "Late or missed payments may pause work and delivery.",
      ],
    },
    {
      heading: "Client responsibilities",
      body: [
        "You agree to provide timely content, feedback, approvals, and access needed to complete the project. Delays in providing these may affect the timeline.",
      ],
    },
    {
      heading: "Revisions & scope",
      body: [
        "Each engagement includes the rounds of revision described in your proposal. Work beyond the agreed scope can be quoted and billed separately.",
      ],
    },
    {
      heading: "Intellectual property",
      body: [
        "Upon full payment, you own the final delivered website and the assets created specifically for you. We retain ownership of pre-existing tools, frameworks, and components, and may feature the completed work in our portfolio unless agreed otherwise.",
      ],
    },
    {
      heading: "Third-party services",
      body: [
        "Projects may rely on third-party platforms such as hosting, payment, or analytics providers. Their use is subject to their own terms, and we are not responsible for their availability or actions.",
      ],
    },
    {
      heading: "Warranties & liability",
      body: [
        "We deliver our services with professional care. To the maximum extent permitted by law, GES is not liable for indirect or consequential damages, and our total liability is limited to the amount you paid for the engagement in question.",
      ],
    },
    {
      heading: "Termination",
      body: [
        "Either party may end an engagement in writing. You remain responsible for payment for work completed up to the termination date.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        "These terms are governed by the laws of Canada and the province in which GES operates, without regard to conflict-of-law principles.",
      ],
    },
    {
      heading: "Contact",
      body: [
        "Questions about these terms can be sent to us through the contact section of this site.",
      ],
    },
  ],
};

export default function Page() {
  return <LegalDoc content={content} />;
}
