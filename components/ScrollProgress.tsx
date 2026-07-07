"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * Slim acid progress bar pinned to the BOTTOM of the viewport that fills as the
 * page scrolls (the top edge is the acid ticker, so a bar there would be
 * invisible). Spring-smoothed so it glides, and it fades in from zero so a tiny
 * sliver + glow doesn't read as a chunky blob at the very top of the page.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  // Hidden at the top, ramps in over the first ~3% of scroll.
  const opacity = useTransform(scrollYProgress, [0, 0.01, 0.03], [0, 0, 1]);

  return (
    <motion.div
      style={{ scaleX, opacity }}
      className="fixed bottom-0 left-0 right-0 z-[60] h-[2px] origin-left bg-[var(--acid)] shadow-[0_0_5px_rgba(204,255,0,0.4)]"
      aria-hidden
    />
  );
}
