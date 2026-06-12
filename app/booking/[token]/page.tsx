"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, Clock, ArrowLeft, ArrowRight, X, Check, Globe } from "lucide-react";
import MonthCalendar from "@/components/MonthCalendar";
import { fmtDateFull, fmtDateLong, fmtTime } from "@/lib/booking";

interface Booking {
  id: string; name: string; slot_date: string; slot_time: string; status: string;
}

export default function ManageBooking() {
  const token = String((useParams()?.token as string) ?? "");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [days, setDays] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [loadErr, setLoadErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [date, setDate] = useState("");
  const [taken, setTaken] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneMsg, setDoneMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/book/manage?token=${encodeURIComponent(token)}`);
      const d = await res.json();
      if (!res.ok) { setLoadErr(d.error ?? "This link is invalid or expired."); return; }
      setBooking(d.booking); setDays(d.days ?? []); setTimes(d.times ?? []);
    } catch { setLoadErr("Network error — please try again."); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);

  async function pickDate(d: string) {
    setDate(d);
    try {
      const res = await fetch(`/api/book?date=${encodeURIComponent(d)}`);
      const data = await res.json();
      setTaken(Array.isArray(data.taken) ? data.taken : []);
    } catch { setTaken([]); }
  }

  async function cancel() {
    if (!confirm("Cancel this discovery call? This frees the slot for someone else.")) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/book/manage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "cancel" }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Couldn't cancel."); return; }
      setBooking((b) => (b ? { ...b, status: "cancelled" } : b));
      setDoneMsg("Your call has been cancelled. The slot is now free.");
    } catch { setError("Network error."); }
    finally { setBusy(false); }
  }

  async function reschedule(time: string) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/book/manage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "reschedule", slot_date: date, slot_time: time }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Couldn't reschedule."); if (res.status === 409) pickDate(date); return; }
      setBooking((b) => (b ? { ...b, slot_date: date, slot_time: time, status: "new" } : b));
      setMode("view"); setDate("");
      setDoneMsg(`Rescheduled to ${fmtDateLong(date)} · ${fmtTime(time)} ET.`);
    } catch { setError("Network error."); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-6 left-6 z-10">
        <Link href="/" className="flex items-center gap-2.5 glass px-4 py-2 rounded-full text-sm text-gray-400 hover:text-white transition-colors">
          <Globe size={14} /> GES
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className={`relative w-full ${mode === "reschedule" ? "max-w-2xl" : "max-w-md"} bg-[#0a0a0a] border-2 border-white shadow-[10px_10px_0_0_#ccff00] transition-all`}
      >
        <div className="border-b-2 border-white/15 px-6 py-4 flex items-center gap-2.5">
          <span className="w-7 h-7 bg-[#ccff00] text-[#0a0a0a] grid place-items-center font-black text-xs border-2 border-white">G</span>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Manage Booking</div>
            <div className="font-extrabold uppercase tracking-tight text-sm leading-none mt-0.5">GES Discovery Call</div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="font-mono text-xs text-gray-500 py-8 text-center">Loading…</div>
          ) : loadErr ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 border-2 border-red-500/50 text-red-400 grid place-items-center mx-auto mb-4"><X size={22} /></div>
              <p className="text-gray-300 text-sm mb-5">{loadErr}</p>
              <Link href="/#book" className="font-mono text-xs font-bold uppercase tracking-[0.08em] border-2 border-white px-5 py-2.5 hover:bg-white hover:text-[#0a0a0a] transition-colors">Book a new call</Link>
            </div>
          ) : doneMsg ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-[#ccff00] text-[#0a0a0a] grid place-items-center mx-auto mb-5 border-2 border-white"><Check size={28} strokeWidth={3} /></div>
              <p className="text-gray-200 text-sm leading-relaxed mb-6">{doneMsg}</p>
              <Link href="/" className="font-mono text-xs font-bold uppercase tracking-[0.08em] border-2 border-white px-6 py-3 hover:bg-white hover:text-[#0a0a0a] transition-colors">Back to GES</Link>
            </div>
          ) : booking && booking.status === "cancelled" ? (
            <div className="text-center py-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-red-400 mb-3">Cancelled</div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">This booking is cancelled. Want to talk? Grab a new time.</p>
              <Link href="/#book" className="inline-flex items-center gap-2 bg-[#ccff00] text-[#0a0a0a] font-mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-3 border-2 border-white hover:gap-3 transition-all">Book a new call <ArrowRight size={14} /></Link>
            </div>
          ) : booking && mode === "view" ? (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-2">Hi {booking.name}, your call is set for</div>
              <div className="font-extrabold text-xl leading-tight mb-1">{fmtDateFull(booking.slot_date)}</div>
              <div className="text-[#ccff00] font-mono font-bold mb-6">{fmtTime(booking.slot_time)} ET</div>
              <div className="flex flex-col gap-2.5">
                <button onClick={() => { setMode("reschedule"); setError(""); }} className="inline-flex items-center justify-center gap-2 bg-[#ccff00] text-[#0a0a0a] font-mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-3.5 border-2 border-white hover:gap-3 transition-all">
                  <CalendarDays size={15} /> Reschedule
                </button>
                <button onClick={cancel} disabled={busy} className="font-mono font-bold uppercase text-xs tracking-[0.08em] px-6 py-3 border-2 border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
                  Cancel booking
                </button>
              </div>
              {error && <div className="font-mono text-xs text-red-400 mt-3">{error}</div>}
            </div>
          ) : booking ? (
            <div>
              <button onClick={() => { setMode("view"); setDate(""); setError(""); }} className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-1 mb-4">
                <ArrowLeft size={12} /> Back
              </button>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-3 flex items-center gap-2">
                <CalendarDays size={13} className="text-[#ccff00]" /> Pick a new time · ET
              </div>
              <div className="grid sm:grid-cols-[1.35fr_1fr] gap-5">
                <MonthCalendar days={days} selected={date} onSelect={pickDate} />
                <div className="sm:border-l-2 sm:border-white/10 sm:pl-5">
                  {!date ? (
                    <div className="h-full grid place-items-center text-center py-8">
                      <span className="font-mono text-[11px] text-gray-500"><Clock size={14} className="mx-auto mb-2 text-gray-600" />Select a day</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                      {times.map((t) => {
                        const gone = taken.includes(t) && !(t === booking.slot_time && date === booking.slot_date);
                        return (
                          <button key={t} disabled={gone || busy} onClick={() => reschedule(t)}
                            className={`border-2 px-2 py-2.5 font-mono text-xs font-bold transition-colors ${gone ? "border-white/10 text-gray-600 line-through cursor-not-allowed" : "border-white/30 hover:border-[#ccff00] hover:bg-[#ccff00]/10"}`}>
                            {fmtTime(t)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {error && <div className="font-mono text-xs text-red-400 mt-3">{error}</div>}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
