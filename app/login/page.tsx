"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Globe, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid code.");
        setLoading(false);
        return;
      }

      // Valid code, but the preview hasn't been published yet.
      if (data.pending) {
        setSuccess(`Your code works — but ${data.name}'s preview isn't quite ready yet. Please check back in a day or so.`);
        setLoading(false);
        return;
      }

      setSuccess(`Welcome, ${data.name}! Loading your preview...`);
      // No cookie: keep the token in sessionStorage for this session only.
      try { sessionStorage.setItem(`ges_pt_${data.slug}`, data.token); } catch {}
      setTimeout(() => {
        window.location.href = `/preview/${data.slug}`;
      }, 1200);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-[#ccff00]/[0.07] rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#e0a11e]/[0.06] rounded-full blur-3xl animate-float-d1" />
      </div>

      {/* Back to home */}
      <div className="absolute top-6 left-6">
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.04 }}
            className="flex items-center gap-2.5 glass px-4 py-2 rounded-full text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <Globe size={14} />
            <span>GES</span>
          </motion.div>
        </Link>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Ambient gradient glow behind the card */}
        <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#ccff00]/25 via-[#e0a11e]/15 to-transparent blur-2xl opacity-70 pointer-events-none" />

        <div className="relative glass rounded-3xl p-10">
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--acid)] to-[var(--acid-deep)] flex items-center justify-center mx-auto mb-8 shadow-[0_0_44px_-4px_rgba(204,255,0,0.45)]"
          >
            <Lock size={26} className="text-[#0a0a0a]" />
          </motion.div>

          <h1 className="text-3xl font-black text-center mb-3 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
            Client Portal
          </h1>
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-[#ccff00]/90 bg-[#ccff00]/10 border border-[#ccff00]/25 rounded-full px-3 py-1">
              <ShieldCheck size={11} /> Private · Encrypted Access
            </span>
          </div>
          <p className="text-gray-400 text-sm text-center mb-8 leading-relaxed">
            Enter the access code from your consultation call to unlock the
            website preview we built for your business.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block">
                Your Access Code
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showCode ? "text" : "password"}
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(""); }}
                  placeholder="Paste your access code"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#ccff00]/60 focus:bg-white/8 transition-all pr-12 font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowCode((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                  aria-label="Toggle visibility"
                >
                  {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Status messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  <XCircle size={15} className="flex-shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3"
                >
                  <CheckCircle2 size={15} className="flex-shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || !code.trim()}
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Unlock Preview <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/8 text-center">
            <p className="text-gray-600 text-xs">
              Don&apos;t have a code?{" "}
              <Link href="/#contact" className="text-[#ccff00] hover:text-[#aee000] transition-colors">
                Contact us to get started →
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
