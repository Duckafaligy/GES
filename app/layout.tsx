import type { Metadata, Viewport } from "next";
import { Archivo, Space_Mono } from "next/font/google";
import "./globals.css";

const SITE_NAME = "GES — Global E-Commerce Saviours";
const SITE_DESC =
  "We build high-converting, visually brutal websites for local businesses and product brands — scroll-driven 3D product animations, cinematic landing pages, and conversion-first design that moves product.";

const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL to your domain so OG/Twitter image URLs resolve absolutely.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ges.dev"),
  title: {
    default: SITE_NAME,
    template: "%s — GES",
  },
  description: SITE_DESC,
  applicationName: "GES",
  keywords: [
    "e-commerce",
    "web design",
    "3D modeling",
    "local business websites",
    "scroll animation",
    "GES",
    "Global E-Commerce Saviours",
  ],
  openGraph: {
    type: "website",
    siteName: "GES",
    title: SITE_NAME,
    description: SITE_DESC,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESC,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
