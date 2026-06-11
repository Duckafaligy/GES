"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Check, CalendarDays, Clock, Download } from "lucide-react";
import {
  SLOT_TIMES,
  upcomingWeekdays,
  fmtDateLong,
  fmtDateFull,
  fmtTime,
  googleCalUrl,
  buildIcs,
} from "@/lib/booking";

type Step = "date" | "time" | "details" | "done";

// Any button anywhere can open this with: window.dispatchEvent(new Event("ges:book"))
export default function BookCall() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("date");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [taken, setTaken] = useState<string[]>([]);
  const [loadingTaken, setLoadingTaken] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", business: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const days = upcomingWeekdays(10);

  const reset = useCallback(() => {
    setStep("date"); setDate(""); setTime(""); setTaken([]);
    setForm({ name: "", email: "", business: "", notes: "" }); setError("");
  }, []);

  useEffect(() => {
    const onOpen = () => { reset(); setOpen(true); };
    window.addEventListener("ges:book", onOpen);
    return () => window.removeEventListener("ges:book", onOpen);
  }, [reset]);

  // lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  async function pickDate(d: string) {
    setDate(d); setTime(""); setStep("time"); setLoadingTaken(true);
    try {
      const res = await fetch(`/api/book?date=${encodeURIComponent(d)}`);
      const data = await res.json();
      setTaken(Array.isArray(data.taken) ? data.taken : []);
    } catch { setTaken([]); }
    finally { setLoadingTaken(false); }
  }

  async function submit() {
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slot_date: date, slot_time: time }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't book — please try again.");
        if (res.status === 409) { setStep("time"); } // slot taken; re-pick
        setSubmitting(false);
        return;
      }
      setStep("done");
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  const close = () => setOpen(false);
  const canSubmit = form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  function downloadIcs() {
    const ics = buildIcs(form.name, form.email, date, time, form.notes);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url; a.download = "ges-discovery-call.ics";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center px-4 py-6 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#0a0a0a] text-white border-2 border-white shadow-[10px_10px_0_0_#ccff00] max-h-[88vh] overflow-y-auto"
          >
            {/* header */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b-2 border-white/15 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 bg-[#ccff00] text-[#0a0a0a] grid place-items-center font-black text-xs border-2 border-white">G</span>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Book a Discovery Call</div>
                  <div className="font-extrabold uppercase tracking-tight text-sm leading-none mt-0.5">30 min · free · zero pressure</div>
                </div>
              </div>
              <button onClick={close} aria-label="Close" className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            {/* step indicator */}
            {step !== "done" && (
              <div className="flex gap-1.5 px-6 pt-4">
                {(["date", "time", "details"] as Step[]).map((s) => (
                  <span key={s} className={`h-1 flex-1 ${["date", "time", "details"].indexOf(step) >= ["date", "time", "details"].indexOf(s) ? "bg-[#ccff00]" : "bg-white/15"}`} />
                ))}
              </div>
            )}

            <div className="p-6">
              {/* STEP 1 — DATE */}
              {step === "date" && (
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3 flex items-center gap-2">
                    <CalendarDays size={13} className="text-[#ccff00]" /> Pick a day
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {days.map((d) => (
                      <button
                        key={d}
                        onClick={() => pickDate(d)}
                        className="border-2 border-white/30 hover:border-[#ccff00] hover:bg-[#ccff00]/10 px-3 py-3 text-left transition-colors"
                      >
                        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{fmtDateLong(d).split(",")[0]}</div>
                        <div className="font-bold text-sm">{fmtDateLong(d).split(", ")[1]}</div>
                      </button>
                    ))}
                  </div>
                  <p className="font-mono text-[10px] text-gray-500 mt-4">Times shown in Eastern (ET). Mon–Fri only.</p>
                </div>
              )}

              {/* STEP 2 — TIME */}
              {step === "time" && (
                <div>
                  <button onClick={() => setStep("date")} className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-1 mb-3">
                    <ArrowLeft size={12} /> {fmtDateLong(date)}
                  </button>
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3 flex items-center gap-2">
                    <Clock size={13} className="text-[#ccff00]" /> Pick a time (ET)
                  </div>
                  {loadingTaken ? (
                    <div className="font-mono text-xs text-gray-500 py-6 text-center">Loading availability…</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {SLOT_TIMES.map((t) => {
                        const gone = taken.includes(t);
                        return (
                          <button
                            key={t}
                            disabled={gone}
                            onClick={() => { setTime(t); setStep("details"); }}
                            className={`border-2 px-2 py-2.5 font-mono text-xs font-bold transition-colors ${
                              gone
                                ? "border-white/10 text-gray-600 line-through cursor-not-allowed"
                                : "border-white/30 hover:border-[#ccff00] hover:bg-[#ccff00]/10"
                            }`}
                          >
                            {fmtTime(t)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 — DETAILS */}
              {step === "details" && (
                <div>
                  <button onClick={() => setStep("time")} className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-1 mb-3">
                    <ArrowLeft size={12} /> {fmtDateLong(date)} · {fmtTime(time)} ET
                  </button>
                  <div className="space-y-3">
                    <Input label="Your name *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Jane Doe" autoFocus />
                    <Input label="Email *" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="jane@business.ca" type="email" />
                    <Input label="Business" value={form.business} onChange={(v) => setForm((f) => ({ ...f, business: v }))} placeholder="Blooms & Co." />
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">What do you want built?</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        rows={3}
                        placeholder="A quick line about your project…"
                        className="w-full bg-transparent border-2 border-white/30 px-3 py-2.5 text-sm focus:outline-none focus:border-[#ccff00] resize-y"
                      />
                    </div>
                  </div>
                  {error && <div className="font-mono text-xs text-red-400 mt-3">{error}</div>}
                  <button
                    onClick={submit}
                    disabled={submitting || !canSubmit}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#ccff00] text-[#0a0a0a] font-mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-3.5 border-2 border-white disabled:opacity-50 disabled:cursor-not-allowed hover:gap-3 transition-all"
                  >
                    {submitting ? "Booking…" : <>Confirm booking <ArrowRight size={15} /></>}
                  </button>
                </div>
              )}

              {/* DONE */}
              {step === "done" && (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-[#ccff00] text-[#0a0a0a] grid place-items-center mx-auto mb-5 border-2 border-white">
                    <Check size={28} strokeWidth={3} />
                  </div>
                  <h3 className="font-extrabold uppercase tracking-tight text-xl mb-2">You&apos;re booked!</h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-1">{fmtDateFull(date)}</p>
                  <p className="text-[#ccff00] font-mono font-bold mb-5">{fmtTime(time)} ET</p>
                  <p className="text-gray-400 text-xs leading-relaxed mb-5">
                    Add it to your calendar so you <span className="text-white">and GES</span> both get a reminder.
                  </p>
                  <div className="flex flex-col gap-2.5 mb-5">
                    <a
                      href={googleCalUrl(date, time, form.notes)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#ccff00] text-[#0a0a0a] font-mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-3.5 border-2 border-white hover:gap-3 transition-all"
                    >
                      <CalendarDays size={15} /> Add to Google Calendar
                    </a>
                    <button
                      onClick={downloadIcs}
                      className="inline-flex items-center justify-center gap-2 font-mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-3 border-2 border-white/40 hover:border-white transition-colors"
                    >
                      <Download size={14} /> Apple / Outlook (.ics)
                    </button>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed mb-5">
                    We&apos;ll also reach out at <span className="text-gray-300">{form.email}</span> to confirm.
                  </p>
                  <button onClick={close} className="font-mono text-xs font-bold uppercase tracking-[0.08em] border-2 border-white px-6 py-3 hover:bg-white hover:text-[#0a0a0a] transition-colors">
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Input({
  label, value, onChange, placeholder, type = "text", autoFocus,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-2 border-white/30 px-3 py-2.5 text-sm focus:outline-none focus:border-[#ccff00]"
      />
    </div>
  );
}
