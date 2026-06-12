"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAY_LABELS, toYMD } from "@/lib/booking";

/* Calendly-style month grid, GES-brutalist. Bookable days outlined, selected
   acid, off-days dimmed; month nav stays within the available range. */
export default function MonthCalendar({
  days, selected, onSelect,
}: {
  days: string[]; // bookable dates, YYYY-MM-DD
  selected: string;
  onSelect: (d: string) => void;
}) {
  const bookable = useMemo(() => new Set(days), [days]);
  const first = days[0] ? new Date(days[0] + "T12:00:00") : new Date();
  const last = days.length ? new Date(days[days.length - 1] + "T12:00:00") : new Date();
  const [view, setView] = useState(() => new Date(first.getFullYear(), first.getMonth(), 1));

  const monthLabel = view.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prevOk = view > new Date(first.getFullYear(), first.getMonth(), 1);
  const nextOk = view < new Date(last.getFullYear(), last.getMonth(), 1);

  const cells: (string | null)[] = [];
  const firstDow = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toYMD(new Date(view.getFullYear(), view.getMonth(), d)));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          disabled={!prevOk}
          aria-label="Previous month"
          className="w-8 h-8 grid place-items-center border-2 border-white/25 hover:border-[#ccff00] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="font-extrabold uppercase tracking-tight text-sm">{monthLabel}</span>
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          disabled={!nextOk}
          aria-label="Next month"
          className="w-8 h-8 grid place-items-center border-2 border-white/25 hover:border-[#ccff00] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center font-mono text-[9px] uppercase tracking-widest text-gray-500 py-1">{d.slice(0, 2)}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((ymd, i) =>
          ymd === null ? (
            <span key={`b${i}`} />
          ) : bookable.has(ymd) ? (
            <button
              key={ymd}
              onClick={() => onSelect(ymd)}
              className={`aspect-square grid place-items-center font-mono text-xs font-bold border-2 transition-colors ${
                selected === ymd
                  ? "bg-[#ccff00] text-[#0a0a0a] border-[#ccff00]"
                  : "border-white/25 hover:border-[#ccff00] hover:bg-[#ccff00]/10"
              }`}
            >
              {Number(ymd.slice(8))}
            </button>
          ) : (
            <span key={ymd} className="aspect-square grid place-items-center font-mono text-xs text-gray-700 select-none">
              {Number(ymd.slice(8))}
            </span>
          )
        )}
      </div>
    </div>
  );
}
