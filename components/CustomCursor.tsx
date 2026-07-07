"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Signature acid cursor ring that trails the pointer and grows over interactive
 * elements. Desktop fine-pointer only; disabled for touch + reduced-motion. The
 * native cursor stays visible — this is an accent on top.
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [down, setDown] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 450, damping: 34, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 450, damping: 34, mass: 0.4 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setEnabled(true);

    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    const over = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(
        'a,button,[role="button"],input,textarea,select,label,summary,.cursor-pointer'
      );
      setHovering(!!el);
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    window.addEventListener("mousedown", dn);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", dn);
      window.removeEventListener("mouseup", up);
    };
  }, [x, y]);

  if (!enabled) return null;
  const size = hovering ? 46 : 24;

  return (
    <motion.div
      aria-hidden
      style={{ left: sx, top: sy }}
      className="pointer-events-none fixed top-0 left-0 z-[100] -translate-x-1/2 -translate-y-1/2 hidden md:block"
    >
      <motion.span
        className="block rounded-full border-2 border-[var(--acid)]"
        animate={{
          width: size,
          height: size,
          opacity: down ? 1 : 0.75,
          backgroundColor: hovering ? "rgba(204,255,0,0.12)" : "rgba(204,255,0,0)",
          scale: down ? 0.85 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
      />
    </motion.div>
  );
}
