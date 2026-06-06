import type { Metadata } from "next";
import { Archivo, Space_Mono } from "next/font/google";
import "./globals.css";

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
  title: "GES — Global E-Commerce Saviours",
  description:
    "We build high-converting, visually brutal websites for local businesses and product brands — scroll-driven 3D product animations, cinematic landing pages, and conversion-first design that moves product.",
  keywords: [
    "e-commerce",
    "web design",
    "3D modeling",
    "local business websites",
    "scroll animation",
    "GES",
    "Global E-Commerce Saviours",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
