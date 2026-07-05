"use client";

import { useState } from "react";

export default function BuyButton({ formatId }: { formatId: string }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function buy() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formatId }),
      });
      const d = await res.json();
      if (res.ok && d.url) { window.location.href = d.url; return; }
      setErr(d.error ?? "Checkout unavailable.");
      setLoading(false);
    } catch {
      setErr("Network error.");
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <button onClick={buy} disabled={loading} className="btn-brut text-[11px] py-2 px-3 disabled:opacity-50">
        {loading ? "…" : "Buy"}
      </button>
      {err && <div className="mono text-[9px] text-red-500 mt-1 max-w-[130px] leading-snug">{err}</div>}
    </div>
  );
}
