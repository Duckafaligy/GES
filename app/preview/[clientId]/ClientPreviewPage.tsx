"use client";

import { motion } from "framer-motion";
import { Client } from "@/lib/clients";
import { Lock, Star, ArrowRight, CheckCircle2, ShoppingBag, ChevronDown, Globe } from "lucide-react";
import Link from "next/link";

interface Props {
  client: Client;
}

export default function ClientPreviewPage({ client }: Props) {
  const { preview } = client;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: preview.bgColor }}
    >
      {/* Top Banner */}
      <div
        className="sticky top-0 z-50 py-2 px-6 flex items-center justify-between text-xs border-b"
        style={{
          backgroundColor: preview.bgColor + "ee",
          backdropFilter: "blur(20px)",
          borderColor: preview.accentColor + "30",
        }}
      >
        <div className="flex items-center gap-2" style={{ color: preview.accentColor }}>
          <Lock size={11} />
          <span className="font-semibold tracking-wider uppercase">GES Client Preview — {client.name}</span>
        </div>
        <Link href="/">
          <span className="text-gray-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1">
            <Globe size={11} />
            GES
          </span>
        </Link>
      </div>

      {/* Watermark overlay */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-30 select-none"
        style={{ opacity: 0.03 }}
      >
        <div className="text-white text-9xl font-black rotate-[-30deg] whitespace-nowrap">
          GES PREVIEW
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at center, ${preview.accentColor}40 0%, transparent 70%)`,
          }}
        />
        <div className="absolute inset-0 grid-pattern opacity-20" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative z-10 text-center max-w-3xl mx-auto pt-20"
        >
          {/* Emoji hero visual */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-8xl md:text-9xl mb-8 inline-block"
          >
            {preview.heroImage}
          </motion.div>

          {/* Brand name */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 text-xs font-medium tracking-wide"
            style={{ color: preview.accentColor, borderColor: preview.accentColor + "40", backgroundColor: preview.accentColor + "15" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: preview.accentColor }} />
            {client.industry} · Est. 2024
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-5">
            {client.name}
          </h1>
          <p className="text-2xl md:text-3xl font-light mb-6" style={{ color: preview.accentColor }}>
            &ldquo;{preview.tagline}&rdquo;
          </p>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            {preview.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 transition-all"
              style={{
                background: `linear-gradient(135deg, ${preview.accentColor}, ${preview.accentColor}aa)`,
                boxShadow: `0 20px 40px ${preview.accentColor}30`,
                color: "white",
              }}
            >
              Shop Now <ArrowRight size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              className="px-8 py-4 rounded-full font-bold text-lg border text-white transition-all hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.2)" }}
            >
              Explore Collection
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600"
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

      {/* ── Pages Overview ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Your Website Includes
            </h2>
            <p className="text-gray-400 text-lg">Every page your business needs, built from scratch</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {preview.pages.map((page, i) => (
              <motion.div
                key={page}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border p-5 text-center cursor-default transition-shadow"
                style={{
                  backgroundColor: preview.accentColor + "10",
                  borderColor: preview.accentColor + "30",
                }}
              >
                <ShoppingBag size={20} className="mx-auto mb-3" style={{ color: preview.accentColor }} />
                <div className="text-white font-semibold text-sm">{page}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-12">
              Included Features
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {preview.features.map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-center gap-4 rounded-2xl p-5 border"
                  style={{
                    backgroundColor: preview.accentColor + "08",
                    borderColor: preview.accentColor + "25",
                  }}
                >
                  <CheckCircle2 size={18} style={{ color: preview.accentColor }} className="flex-shrink-0" />
                  <span className="text-gray-200 font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Investment Summary ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl p-10 border"
            style={{
              backgroundColor: preview.accentColor + "10",
              borderColor: preview.accentColor + "30",
            }}
          >
            {/* gradient top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, transparent, ${preview.accentColor}, transparent)`,
              }}
            />
            <div className="flex items-center justify-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill={preview.accentColor} style={{ color: preview.accentColor }} />
              ))}
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Your Investment</h2>
            <p className="text-gray-400 text-sm mb-6">Estimated for this project scope</p>
            <div className="text-4xl font-black mb-2" style={{ color: preview.accentColor }}>
              {preview.pricing}
            </div>
            <p className="text-gray-500 text-sm mb-8">
              30% non-refundable deposit to begin · Remaining due on delivery
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              This preview was created exclusively for <strong className="text-white">{client.name}</strong>.
              To move forward, reply to your consultation email or contact us directly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t py-8 px-6 text-center text-xs text-gray-700" style={{ borderColor: preview.accentColor + "20" }}>
        <p>This is a confidential preview prepared by <strong className="text-gray-500">GES — Global E-Commerce Saviours</strong> for {client.name}.</p>
        <p className="mt-1">Unauthorized distribution is prohibited. © 2024 GES.</p>
      </div>
    </div>
  );
}
