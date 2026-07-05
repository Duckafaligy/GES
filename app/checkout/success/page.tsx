"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<{ url: string; label: string; title: string } | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get("session_id");
    if (!sid) { setState("error"); setMsg("Missing checkout session."); return; }
    (async () => {
      try {
        const res = await fetch(`/api/download?session_id=${encodeURIComponent(sid)}`);
        const d = await res.json();
        if (!res.ok) { setState("error"); setMsg(d.error ?? "Could not verify your purchase."); return; }
        setData(d);
        setState("ready");
      } catch {
        setState("error");
        setMsg("Network error — please refresh.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen sec-light grid place-items-center px-5 py-16">
      <div className="hard bg-[var(--bg)] w-full max-w-lg p-8 text-center">
        {state === "loading" && <div className="mono text-sm text-[var(--muted)]">Verifying your purchase…</div>}

        {state === "error" && (
          <>
            <div className="eyebrow text-red-500 mb-2">Something went wrong</div>
            <p className="text-sm text-[var(--muted)] mb-6">{msg}</p>
            <Link href="/templates" className="btn-ghost">Back to templates</Link>
          </>
        )}

        {state === "ready" && data && (
          <>
            <div className="eyebrow text-[var(--muted)] mb-2">Payment complete</div>
            <h1 className="display text-3xl mb-2">Thank you!</h1>
            <p className="text-sm text-[var(--muted)] mb-7">
              {data.title} — {data.label}. Your download link is ready (valid ~10 minutes).
            </p>
            <a href={data.url} className="btn-brut">Download files ↓</a>
            <p className="mono text-[10px] text-[var(--muted)] mt-7 leading-relaxed">
              A receipt was emailed by Stripe. Buyer accounts with permanent re-downloads are coming next.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
