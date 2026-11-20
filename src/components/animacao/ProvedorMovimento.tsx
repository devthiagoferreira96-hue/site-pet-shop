"use client";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** reducedMotion="user": respeita a preferência "reduzir movimento" do sistema em todas as animações do Motion. */
export function ProvedorMovimento({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
