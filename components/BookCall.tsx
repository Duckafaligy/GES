"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, ArrowLeft, ArrowRight, Check, CalendarDays, Clock, Download, Mail, ShieldCheck,
} from "lucide-react";
import MonthCalendar from "@/components/MonthCalendar";
import {
  SLOT_TIMES,
  upcomingWeekdays,
  fmtDateLong,
  fmtDateFull,
  fmtTime,
  googleCalUrl,
  buildIcs,
} from "@/lib/booking";

type Step = "email" | "code" | "schedule" | "details" | "done";

const BOOKER_KEY = "ges_booker"; // sessionStorage: { token, email, exp }

function loadBooker(): { token: string; email: string } | null {
  try {
    const raw = sessionStorage.getItem(BOOKER_KEY);
    if (!raw) return null;
    const b = JSON.parse(raw);
    if (b.exp && b.exp > Date.now() && b.token && b.email) return b;
    sessionStorage.removeItem(BOOKER_KEY);
  } catch { /* ignore */ }
  return null;
}

// Any button anywhere can open this with: window.dispatchEvent(new Event("ges:book"))
export default function BookCall({ inline = false }: { inline?: boolean }) {
  const [open, setOpen] = useState(inline);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [booker, setBooker] = useState<{ token: string; email: string } | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [taken, setTaken] = useState<string[]>([]);
  const [loadingTaken, setLoadingTaken] = useState(false);
  const [form, setForm] = useState({ name: "", business: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Bookable days/times come from the server (dashboard-controlled).
  const [days, setDays] = useState<string[]>(() => upcomingWeekdays(10));
  const [times, setTimes] = useState<string[]>(() => [...SLOT_TIMES]);

  const reset = useCallback(() => {
    setCodeInput(""); setDate(""); setTime(""); setTaken([]);
    setForm({ name: "", business: "", notes: "" }); setError(""); setBusy(false);
    const b = loadBooker();
    setBooker(b);
    if (b) { setEmail(b.email); setStep("schedule"); }
    else setStep("email");
  }, []);

  useEffect(() => {
    const loadAvail = () =>
      fetch("/api/availability")
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.days) && d.days.length) setDays(d.days);
          if (Array.isArray(d.times) && d.times.length) setTimes(d.times);
        })
        .catch(() => {});
    // Inline section: render the flow in place (no modal/event needed).
    if (inline) { reset(); loadAvail(); return; }
    const onOpen = () => { reset(); setOpen(true); loadAvail(); };
    window.addEventListener("ges:book", onOpen);
    return () => window.removeEventListener("ges:book", onOpen);
  }, [reset, inline]);

  useEffect(() => {
    if (!open || inline) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, inline]);

  function saveBooker(token: string, em: string) {
    const b = { token, email: em, exp: Date.now() + 110 * 60 * 1000 };
    try { sessionStorage.setItem(BOOKER_KEY, JSON.stringify(b)); } catch { /* ignore */ }
    setBooker({ token, email: em });
  }

  async function requestCode() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Couldn't send the code."); return; }
      if (d.skipVerification && d.token) { saveBooker(d.token, email.trim().toLowerCase()); setStep("schedule"); return; }
      setCodeInput("");
      setStep("code");
    } catch { setError("Network error. Please try again."); }
    finally { setBusy(false); }
  }

  async function verifyCode() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: codeInput.trim() }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Wrong code."); return; }
      saveBooker(d.token, email.trim().toLowerCase());
      setStep("schedule");
    } catch { setError("Network error. Please try again."); }
    finally { setBusy(false); }
  }

  async function pickDate(d: string) {
    setDate(d); setTime(""); setLoadingTaken(true);
    try {
      const res = await fetch(`/api/book?date=${encodeURIComponent(d)}`);
      const data = await res.json();
      setTaken(Array.isArray(data.taken) ? data.taken : []);
    } catch { setTaken([]); }
    finally { setLoadingTaken(false); }
  }

  async function submit() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(booker ? { Authorization: `Bearer ${booker.token}` } : {}),
        },
        body: JSON.stringify({ ...form, email, slot_date: date, slot_time: time }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (res.status === 401) { // token expired → re-verify
          sessionStorage.removeItem(BOOKER_KEY); setBooker(null);
          setError("Your verification expired — confirm your email again.");
          setStep("email");
          return;
        }
        setError(d.error ?? "Couldn't book — please try again.");
        if (res.status === 409) { setStep("schedule"); pickDate(date); }
        return;
      }
      setStep("done");
    } catch { setError("Network error. Please try again."); }
    finally { setBusy(false); }
  }

  const close = () => setOpen(false);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function downloadIcs() {
    const ics = buildIcs(form.name, email, date, time, form.notes);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url; a.download = "ges-discovery-call.ics";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const STEPS: Step[] = ["email", "code", "schedule", "details"];
  const stepIdx = STEPS.indexOf(step);

  const panel = (
    <>
            {/* header */}
            <div className={`${inline ? "" : "sticky top-0 z-10"} bg-[#0a0a0a] border-b-2 border-white/15 px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 bg-[#ccff00] text-[#0a0a0a] grid place-items-center font-black text-xs border-2 border-white">G</span>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Book a Discovery Call</div>
                  <div className="font-extrabold uppercase tracking-tight text-sm leading-none mt-0.5">30 min · free · zero pressure</div>
                </div>
              </div>
              {!inline && <button onClick={close} aria-label="Close" className="text-gray-400 hover:text-white"><X size={18} /></button>}
            </div>

            {/* step indicator */}
            {step !== "done" && (
              <div className="flex gap-1.5 px-6 pt-4">
                {STEPS.map((s, i) => (
                  <span key={s} className={`h-1 flex-1 ${stepIdx >= i ? "bg-[#ccff00]" : "bg-white/15"}`} />
                ))}
              </div>
            )}

            <div className="p-6">
              {/* STEP 1 — EMAIL (sign up) */}
              {step === "email" && (
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-1 flex items-center gap-2">
                    <Mail size={13} className="text-[#ccff00]" /> Your email
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">
                    We&apos;ll send a 6-digit code to verify it&apos;s really you — keeps the calendar free of junk bookings.
                  </p>
                  <input
                    type="email"
                    value={email}
                    autoFocus={!inline}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && emailOk && !busy) requestCode(); }}
                    placeholder="you@business.ca"
                    className="w-full bg-transparent border-2 border-white/30 px-3 py-3 font-mono text-sm focus:outline-none focus:border-[#ccff00]"
                  />
                  {error && <div className="font-mono text-xs text-red-400 mt-3">{error}</div>}
                  <button
                    onClick={requestCode}
                    disabled={busy || !emailOk}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#ccff00] text-[#0a0a0a] font-mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-3.5 border-2 border-white disabled:opacity-50 disabled:cursor-not-allowed hover:gap-3 transition-all"
                  >
                    {busy ? "Sending code…" : <>Continue <ArrowRight size={15} /></>}
                  </button>
                </div>
              )}

              {/* STEP 2 — CODE */}
              {step === "code" && (
                <div>
                  <button onClick={() => setStep("email")} className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-1 mb-3">
                    <ArrowLeft size={12} /> {email}
                  </button>
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-1 flex items-center gap-2">
                    <ShieldCheck size={13} className="text-[#ccff00]" /> Enter the 6-digit code
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">
                    We emailed it to <span className="text-white">{email}</span>. It expires in 10 minutes.
                  </p>
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={codeInput}
                    autoFocus={!inline}
                    onChange={(e) => { setCodeInput(e.target.value.replace(/\D/g, "")); setError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && codeInput.length === 6 && !busy) verifyCode(); }}
                    placeholder="••••••"
                    className="w-full bg-transparent border-2 border-white/30 px-3 py-3 font-mono text-2xl tracking-[0.5em] text-center focus:outline-none focus:border-[#ccff00]"
                  />
                  {error && <div className="font-mono text-xs text-red-400 mt-3">{error}</div>}
                  <button
                    onClick={verifyCode}
                    disabled={busy || codeInput.length !== 6}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#ccff00] text-[#0a0a0a] font-mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-3.5 border-2 border-white disabled:opacity-50 disabled:cursor-not-allowed hover:gap-3 transition-all"
                  >
                    {busy ? "Verifying…" : <>Verify <ArrowRight size={15} /></>}
                  </button>
                  <button onClick={requestCode} disabled={busy} className="mt-3 w-full font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:text-white">
                    Resend code
                  </button>
                </div>
              )}

              {/* STEP 3 — SCHEDULE (calendar + times, Calendly-style two-pane) */}
              {step === "schedule" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 flex items-center gap-2">
                      <CalendarDays size={13} className="text-[#ccff00]" /> Pick a time <span className="text-gray-600">· ET</span>
                    </div>
                    {booker && (
                      <span className="font-mono text-[10px] text-gray-500 flex items-center gap-1">
                        <ShieldCheck size={11} className="text-[#ccff00]" /> {booker.email}
                      </span>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-[1.35fr_1fr] gap-5">
                    <MonthCalendar days={days} selected={date} onSelect={pickDate} />
                    <div className="sm:border-l-2 sm:border-white/10 sm:pl-5">
                      {!date ? (
                        <div className="h-full grid place-items-center text-center py-8">
                          <span className="font-mono text-[11px] text-gray-500 leading-relaxed">
                            <Clock size={14} className="mx-auto mb-2 text-gray-600" />
                            Select a day to see times
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-2.5">{fmtDateLong(date)}</div>
                          {loadingTaken ? (
                            <div className="font-mono text-xs text-gray-500 py-6 text-center">Loading…</div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                              {times.map((t) => {
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
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 — DETAILS */}
              {step === "details" && (
                <div>
                  <button onClick={() => setStep("schedule")} className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-1 mb-3">
                    <ArrowLeft size={12} /> {fmtDateLong(date)} · {fmtTime(time)} ET
                  </button>
                  <div className="space-y-3">
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">Email</label>
                      <div className="flex items-center gap-2 border-2 border-white/15 px-3 py-2.5 font-mono text-sm text-gray-300">
                        <ShieldCheck size={13} className="text-[#ccff00] flex-shrink-0" /> {email} <span className="text-[#ccff00] text-[10px] ml-auto">verified</span>
                      </div>
                    </div>
                    <Input label="Your name *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Jane Doe" autoFocus={!inline} />
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
                    disabled={busy || !form.name.trim()}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#ccff00] text-[#0a0a0a] font-mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-3.5 border-2 border-white disabled:opacity-50 disabled:cursor-not-allowed hover:gap-3 transition-all"
                  >
                    {busy ? "Booking…" : <>Confirm booking <ArrowRight size={15} /></>}
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
                    A confirmation is on its way to <span className="text-gray-300">{email}</span>.
                  </p>
                  <button
                    onClick={() => { if (inline) { reset(); } else { close(); } }}
                    className="font-mono text-xs font-bold uppercase tracking-[0.08em] border-2 border-white px-6 py-3 hover:bg-white hover:text-[#0a0a0a] transition-colors"
                  >
                    {inline ? "Book another" : "Done"}
                  </button>
                </div>
              )}
            </div>
    </>
  );

  // ── Inline section (near the footer) ──
  if (inline) {
    return (
      <section id="book" className="sec-dark py-24 border-t-2 border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center gap-4 mb-10 border-b-2 border-[var(--line)] pb-4">
            <span className="eyebrow">08 / Book</span>
            <span className="flex-1 h-[2px] bg-[var(--line)] opacity-25" />
            <span className="eyebrow text-[var(--amber)]">Free · 30 min</span>
          </div>
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
            <div>
              <h2 className="glow-acid display text-[clamp(2.2rem,5.5vw,4.2rem)] mb-5">
                Grab A{" "}
                <span className="inline-block bg-[var(--acid)] text-[#0a0a0a] px-2">Time</span>
              </h2>
              <p className="text-[var(--muted)] text-base md:text-lg leading-relaxed">
                Verify your email, pick a slot, and we&apos;ll meet for a free 30-minute
                discovery call — we learn your business, then build you a tailored
                preview. No obligation until you approve the design.
              </p>
            </div>
            <div className="bg-[#0a0a0a] text-white border-2 border-white shadow-[10px_10px_0_0_var(--acid)] overflow-hidden">
              {panel}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Modal (triggered by "Book a Meeting" / Contact buttons) ──
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
            className={`relative w-full ${step === "schedule" ? "max-w-2xl" : "max-w-lg"} bg-[#0a0a0a] text-white border-2 border-white shadow-[10px_10px_0_0_#ccff00] max-h-[88vh] overflow-y-auto transition-all`}
          >
            {panel}
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
