"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Globe, Eye, EyeOff, XCircle } from "lucide-react";
import Link from "next/link";

const b64urlDecode = (s: string) => {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  return atob(t);
};
function tokenExp(t: string): number {
  try {
    const p = JSON.parse(b64urlDecode(t.split(".")[0]));
    return typeof p.exp === "number" ? p.exp : 0;
  } catch {
    return 0;
  }
}

export default function BusinessPreview() {
  const params = useParams();
  const business = String((params?.business as string) ?? "");

  const [checked, setChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const key = `ges_pt_${business}`;
    const t = sessionStorage.getItem(key);
    if (t && tokenExp(t) > Date.now()) setToken(t);
    else if (t) sessionStorage.removeItem(key);
    setChecked(true);
  }, [business]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), business }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code.");
        setLoading(false);
        return;
      }
      sessionStorage.setItem(`ges_pt_${business}`, data.token);
      setToken(data.token);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  function exit() {
    sessionStorage.removeItem(`ges_pt_${business}`);
    setToken(null);
    setCode("");
    setLoading(false);
  }

  if (!checked) return <div className="min-h-screen bg-[#070707]" />;

  // ── Authed: show the gated build full-screen ──
  if (token) {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col">
        <div className="flex items-center justify-between px-5 py-2 text-xs glass border-b border-white/10 flex-shrink-0">
          <span className="flex items-center gap-2 text-[#ccff00]/90 font-semibold tracking-wider uppercase">
            <Lock size={11} /> GES Client Preview
          </span>
          <button onClick={exit} className="text-gray-400 hover:text-white transition-colors">
            Exit preview
          </button>
        </div>
        {/* Sandbox without allow-same-origin: the uploaded build runs as an
            opaque origin, so its scripts can't read this page's sessionStorage
            (the preview token). Static assets still load over /raw/<token>/. */}
        <iframe
          src={`/raw/${token}`}
          sandbox="allow-scripts allow-forms allow-popups"
          className="flex-1 w-full border-0"
          title="GES Client Preview"
        />
      </div>
    );
  }

  // ── Code prompt ──
  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-[#ccff00]/[0.07] rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#e0a11e]/[0.06] rounded-full blur-3xl animate-float-d1" />
      </div>

      <div className="absolute top-6 left-6">
        <Link href="/">
          <span className="flex items-center gap-2.5 glass px-4 py-2 rounded-full text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
            <Globe size={14} /> GES
          </span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#ccff00]/25 via-[#e0a11e]/15 to-transparent blur-2xl opacity-70 pointer-events-none" />
        <div className="relative glass rounded-3xl p-10">
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--acid)] to-[var(--acid-deep)] flex items-center justify-center mx-auto mb-8 shadow-[0_0_44px_-4px_rgba(204,255,0,0.45)]"
          >
            <Lock size={26} className="text-[#0a0a0a]" />
          </motion.div>

          <h1 className="text-3xl font-black text-center mb-3 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
            Your Preview
          </h1>
          <p className="text-gray-400 text-sm text-center mb-8 leading-relaxed">
            Enter the access code from your consultation call to unlock the website
            preview we built for your business.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block">Access Code</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(""); }}
                  placeholder="Paste your access code"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#ccff00]/60 focus:bg-white/8 transition-all pr-12 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                  aria-label="Toggle visibility"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  <XCircle size={15} className="flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  Unlock Preview <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/8 text-center">
            <p className="text-gray-600 text-xs">
              Don&apos;t have a code?{" "}
              <Link href="/#contact" className="text-[#ccff00] hover:text-[#aee000] transition-colors">
                Contact us →
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
