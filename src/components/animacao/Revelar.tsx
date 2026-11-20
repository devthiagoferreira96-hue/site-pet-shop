"use client";
/**
 * Entrada suave ao rolar a página (fade + leve subida), com Motion.
 * Com "reduzir movimento", o MotionConfig desliga o deslocamento e mantém só o esmaecer.
 */
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Revelar({ children, atraso = 0, como = "div", className }: { children: ReactNode; atraso?: number; como?: "div" | "li" | "section"; className?: string }) {
  const M = como === "li" ? motion.li : como === "section" ? motion.section : motion.div;
  return (
    <M className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.5, delay: atraso, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </M>
  );
}
