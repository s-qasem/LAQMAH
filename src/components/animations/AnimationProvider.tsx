"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type AnimationProviderProps = {
  children: ReactNode;
};

export function AnimationProvider({ children }: AnimationProviderProps) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    return () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }, []);

  return children;
}
