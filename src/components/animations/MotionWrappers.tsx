"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

const viewport = { once: true, amount: 0.2 } as const;
const transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as const;

export function FadeIn(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewport}
      transition={transition}
      {...props}
    />
  );
}

export function SlideUp(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={transition}
      {...props}
    />
  );
}

export function Reveal(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      whileInView={{ clipPath: "inset(0 0 0% 0)" }}
      viewport={viewport}
      transition={transition}
      {...props}
    />
  );
}
