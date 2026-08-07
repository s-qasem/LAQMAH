"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ChocolateSequenceSceneProps = {
  fallbackSrc: string;
  alt: string;
  sequencePath?: string;
  frameCount?: number;
  videoSrc?: string;
};

type SceneMode = "fallback" | "sequence" | "video";

function framePath(pattern: string, frame: number) {
  return pattern.replace("{frame}", String(frame).padStart(4, "0"));
}

export function ChocolateSequenceScene({ fallbackSrc, alt, sequencePath, frameCount = 0, videoSrc }: ChocolateSequenceSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const [mode, setMode] = useState<SceneMode>("fallback");
  const [reducedMotion, setReducedMotion] = useState(false);

  const drawFrame = (frame: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const scale = Math.max(width / frame.naturalWidth, height / frame.naturalHeight);
    const drawWidth = frame.naturalWidth * scale;
    const drawHeight = frame.naturalHeight * scale;
    context.clearRect(0, 0, width, height);
    context.drawImage(frame, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    framesRef.current = [];

    // Sequence assets are optional. Until they are delivered, the clean still remains visible.
    if (reducedMotion) {
      queueMicrotask(() => { if (!cancelled) setMode("fallback"); });
      return () => { cancelled = true; };
    }

    if (!sequencePath || frameCount < 2) {
      queueMicrotask(() => { if (!cancelled) setMode(videoSrc ? "video" : "fallback"); });
      return () => { cancelled = true; };
    }

    const frames = Array.from({ length: frameCount }, (_, index) => {
      const frame = new window.Image();
      frame.decoding = "async";
      frame.src = framePath(sequencePath, index + 1);
      return frame;
    });

    Promise.all(frames.map((frame) => frame.decode()))
      .then(() => {
        if (cancelled) return;
        framesRef.current = frames;
        setMode("sequence");
        drawFrame(frames[0]);
      })
      .catch(() => {
        if (!cancelled) setMode(videoSrc ? "video" : "fallback");
      });

    return () => { cancelled = true; };
  }, [frameCount, reducedMotion, sequencePath, videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mode !== "video" || reducedMotion) return;

    const play = () => {
      video.muted = true;
      video.defaultMuted = true;
      void video.play().catch(() => {});
    };

    play();
    video.addEventListener("canplay", play, { once: true });
    return () => video.removeEventListener("canplay", play);
  }, [mode, reducedMotion]);

  useGSAP(() => {
    if (reducedMotion || mode !== "sequence") return;
    const trigger = sceneRef.current?.closest<HTMLElement>(".dessert-scene");
    if (!trigger) return;

    const scrollTrigger = ScrollTrigger.create({
      trigger,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: ({ progress }) => {
        const frames = framesRef.current;
        const frame = frames[Math.min(frames.length - 1, Math.round(progress * (frames.length - 1)))];
        if (frame) drawFrame(frame);
      },
    });

    return () => scrollTrigger.kill();
  }, { scope: sceneRef, dependencies: [mode, reducedMotion] });

  return (
    <div ref={sceneRef} className="dessert-artboard">
      <Image src={fallbackSrc} alt={alt} fill sizes="100vw" className="dessert-sequence__fallback" />
      <canvas ref={canvasRef} className="dessert-sequence__canvas" hidden={mode !== "sequence"} aria-hidden="true" />
      {videoSrc ? <video ref={videoRef} className="dessert-sequence__video" src={videoSrc} poster={fallbackSrc} autoPlay muted loop playsInline preload="metadata" controls={false} hidden={mode !== "video"} onError={() => setMode("fallback")} aria-hidden="true" /> : null}
      <div className="coffee-steam" aria-hidden="true"><span /><span /></div>
    </div>
  );
}
