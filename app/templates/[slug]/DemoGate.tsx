"use client";

import { useState } from "react";

export default function DemoGate({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoUrl, setDemoUrl] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slug }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setLoading(false); return; }
      if (data.url) setDemoUrl(data.url);
      else setNote(data.message ?? "Live demo coming soon.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (demoUrl) {
    return (
      <div className="hard bg-black overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-[var(--line)] bg-[var(--bg)]">
          <span className="eyebrow text-[var(--muted)]">Live demo</span>
          <a href={demoUrl} target="_blank" rel="noreferrer" className="eyebrow ul-link">Open full ↗</a>
        </div>
        <iframe src={demoUrl} title="Live demo" className="w-full border-0" style={{ height: 460 }} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="hard bg-[var(--bg)] p-6">
      <div className="eyebrow text-[var(--muted)] mb-2">Try the live demo</div>
      <p className="text-sm text-[var(--muted)] mb-4">Enter your email to open the full interactive demo.</p>
      {note ? (
        <div className="mono text-xs text-[var(--muted)]">{note}</div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="you@email.com"
            className="flex-1 bg-transparent border-2 border-[var(--line)] px-3 py-2.5 text-sm mono focus:outline-none focus:border-[var(--acid)]"
          />
          <button type="submit" disabled={loading || !email} className="btn-brut disabled:opacity-50">
            {loading ? "Loading…" : "Try demo"}
          </button>
        </div>
      )}
      {error && <div className="mono text-xs text-red-500 mt-3">{error}</div>}
    </form>
  );
}
