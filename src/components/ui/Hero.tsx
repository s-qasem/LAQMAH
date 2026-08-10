"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";

import { Container } from "@/components/layout/Container";
import { images } from "@/data/images";

import styles from "./Hero.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const headlineLines = ["A PLACE TO", "GATHER, SIP &", "STAY AWHILE"] as const;

export function Hero() {
  const pathname = usePathname();
  const heroRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [desktopImageFailed, setDesktopImageFailed] = useState(false);
  const [mobileImageFailed, setMobileImageFailed] = useState(false);

  useGSAP(
    () => {
      if (pathname !== "/") return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        gsap.set("[data-hero-reveal]", { autoAlpha: 1, y: 0 });
        gsap.set("[data-hero-line]", { scaleX: 1 });
        gsap.set("[data-hero-curve]", { strokeDashoffset: 0 });
        return;
      }

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

      intro
        .fromTo(sceneRef.current, { scale: 1.06 }, { scale: 1, duration: 2.4, ease: "power2.out" })
        .fromTo(
          "[data-hero-line]",
          { scaleX: 0 },
          { scaleX: 1, duration: 1.2, transformOrigin: "left center" },
          0.35,
        )
        .fromTo(
          "[data-hero-reveal]",
          { autoAlpha: 0, y: 34 },
          { autoAlpha: 1, y: 0, duration: 1.05, stagger: 0.12 },
          0.5,
        )
        .fromTo(
          "[data-hero-actions]",
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.9 },
          1.15,
        )
        .fromTo(
          "[data-hero-curve]",
          { strokeDashoffset: 940 },
          { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" },
          0.85,
        );

      gsap.to(sceneRef.current, {
        yPercent: 7,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      gsap.to("[data-scroll-mark]", {
        y: 9,
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: heroRef, dependencies: [pathname], revertOnUpdate: true },
  );

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!sceneRef.current || event.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 1023px)").matches) return;

    const x = (event.clientX / window.innerWidth - 0.5) * 8;
    const y = (event.clientY / window.innerHeight - 0.5) * 6;
    gsap.to(sceneRef.current, { x, y, duration: 1.8, ease: "power2.out", overwrite: "auto" });
  };

  const handlePointerLeave = () => {
    if (!sceneRef.current) return;
    gsap.to(sceneRef.current, { x: 0, y: 0, duration: 2, ease: "power2.out", overwrite: "auto" });
  };

  return (
    <section
      ref={heroRef}
      id="home"
      className={styles.hero}
      aria-labelledby="hero-heading"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div ref={sceneRef} className={styles.scene} aria-hidden="true">
        {!desktopImageFailed ? (
          <Image
            src={images.hero}
            alt=""
            fill
            priority
            sizes="100vw"
            className={`${styles.image} ${styles.desktopImage}`}
            onError={() => setDesktopImageFailed(true)}
          />
        ) : null}
        {!mobileImageFailed ? (
          <Image
            src="/exterior/mobile-hero.png"
            alt=""
            fill
            priority
            sizes="(max-width: 767px) 100vw, 0px"
            className={styles.mobileImage}
            onError={() => setMobileImageFailed(true)}
          />
        ) : null}
      </div>

      <div className={styles.overlays} aria-hidden="true" />

      <Container className={styles.contentShell}>
        <div className={styles.content}>
          <div className={styles.eyebrowRow} data-hero-reveal>
            <span className={styles.goldLine} data-hero-line />
            <p className={styles.eyebrow}>More Than Coffee</p>
          </div>

          <div className={styles.mainContentGroup}>
            <h1 id="hero-heading" className={styles.heading}>
              {headlineLines.map((line) => (
                <span key={line} className={styles.headingLine} data-hero-reveal>
                  {line}
                </span>
              ))}
            </h1>

            <p className={styles.description} data-hero-reveal>
              Specialty coffee, fresh juices, delicious desserts and good company.<br />
              Welcome to LQMAH.
            </p>

            <div className={styles.actions} data-hero-actions>
              <a className={styles.primaryAction} href="/menu">
                Explore Our Menu <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </Container>

      <svg className={styles.decorativeCurve} viewBox="0 0 1000 240" fill="none" aria-hidden="true">
        <path data-hero-curve pathLength="940" d="M20 190 C170 115 280 218 410 154 C535 92 493 28 421 58 C349 88 407 173 523 149 C690 114 780 58 980 42" />
      </svg>

      <a className={styles.scrollIndicator} href="#welcome" aria-label="Scroll to explore">
        <span className={styles.scrollMark} data-scroll-mark><ArrowDown aria-hidden="true" /></span>
      </a>
    </section>
  );
}
