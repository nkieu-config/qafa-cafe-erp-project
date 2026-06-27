"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const AnimatedPageInner = dynamic(
  () => import("./animated-page-inner").then((m) => m.AnimatedPageInner),
  { ssr: false },
);

export function AnimatedPage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <AnimatedPageInner className={className}>{children}</AnimatedPageInner>;
}

export { staggerContainer, staggerItem } from "./animated-page-inner";
