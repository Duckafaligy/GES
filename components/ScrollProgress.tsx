"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Slim acid progress bar pinned to the BOTTOM of the viewport that fills as the
 * page scrolls (the top edge is the acid ticker, so a bar there would be
 * invisible). Spring-smoothed so it glides.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed bottom-0 left-0 right-0 z-[60] h-[3px] origin-left bg-[var(--acid)] shadow-[0_0_12px_rgba(204,255,0,0.6)]"
      aria-hidden
    />
  );
}
