"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

type SmoothScrollProviderProps = {
  children: ReactNode;
};

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
    });

    return () => lenis.destroy();
  }, []);

  return children;
}
