"use client";

import { useEffect, useState } from "react";

export function IntroOverlay() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || sessionStorage.getItem("lqmah-intro-seen")) return;
    sessionStorage.setItem("lqmah-intro-seen", "true");
    const frame = window.requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => setVisible(false), 1800);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, []);
  if (!visible) return null;
  return <div className="intro-overlay" aria-hidden="true"><span>LQMAH</span><i /><b lang="ar">لقمة</b></div>;
}
