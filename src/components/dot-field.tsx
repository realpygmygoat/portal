"use client";

import { useEffect, useRef } from "react";

// Draws a fixed halftone grid of dots (brass + sage, matching the portfolio
// site's banner-derived texture) and sends a ripple through it on click —
// nearby dots brighten, grow, and push outward along the wave as it passes,
// the way a drop disturbs a pattern of dots on water. Ported from a vanilla
// canvas script; see the original for the full physics writeup.
export function DotField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SPACING = 28;
    const RADIUS = 1.4;
    const BASE_OPACITY = 0.22;
    const WAVE_SPEED = 0.5; // px/ms
    const WAVE_BAND = 22; // px
    const DECAY_MS = 1100;
    const MAX_DISPLACE = 9;
    const MAX_ALPHA_BOOST = 0.65;
    const MAX_RADIUS_BOOST = 1.6;

    function readColors() {
      const style = getComputedStyle(document.documentElement);
      return {
        brass: style.getPropertyValue("--brass").trim() || "#C89B3C",
        sage: style.getPropertyValue("--sage").trim() || "#6B8A7A",
      };
    }

    const colors = readColors();
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssW = 0;
    let cssH = 0;
    let ripples: { x: number; y: number; start: number }[] = [];
    let looping = false;
    let rafId = 0;

    function maskAlpha(x: number, y: number) {
      const cx = cssW * 0.5;
      const cy = cssH * 0.45;
      const rx = cssW * 0.7;
      const ry = cssH * 0.65;
      const d = Math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2);
      if (d <= 0.35) return 0;
      if (d >= 0.85) return 1;
      return (d - 0.35) / (0.85 - 0.35);
    }

    function draw(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, cssW, cssH);

      const layers = [
        { offX: 0, offY: 0, color: colors.brass },
        { offX: SPACING / 2, offY: SPACING / 2, color: colors.sage },
      ];

      for (const layer of layers) {
        for (let gx = layer.offX - SPACING; gx <= cssW + SPACING; gx += SPACING) {
          for (let gy = layer.offY - SPACING; gy <= cssH + SPACING; gy += SPACING) {
            const base = maskAlpha(gx, gy);
            if (base <= 0 && ripples.length === 0) continue;

            let dx = 0,
              dy = 0,
              boost = 0;
            for (const r of ripples) {
              const rdx = gx - r.x;
              const rdy = gy - r.y;
              const dist = Math.sqrt(rdx * rdx + rdy * rdy) || 0.0001;
              const waveRadius = WAVE_SPEED * (now - r.start);
              const diff = dist - waveRadius;
              const pulse = Math.exp(-(diff * diff) / (2 * WAVE_BAND * WAVE_BAND));
              const envelope = Math.exp(-(now - r.start) / DECAY_MS);
              const influence = pulse * envelope;
              if (influence > boost) boost = influence;
              dx += (rdx / dist) * influence * MAX_DISPLACE;
              dy += (rdy / dist) * influence * MAX_DISPLACE;
            }

            const alpha = Math.min(1, base * BASE_OPACITY + boost * MAX_ALPHA_BOOST);
            if (alpha <= 0.003) continue;
            const radius = RADIUS + boost * MAX_RADIUS_BOOST;

            ctx.beginPath();
            ctx.arc(gx + dx, gy + dy, radius, 0, Math.PI * 2);
            ctx.fillStyle = layer.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0);
    }

    function frame(now: number) {
      ripples = ripples.filter((r) => now - r.start < DECAY_MS * 2.2);
      draw(now);
      if (ripples.length > 0) {
        rafId = requestAnimationFrame(frame);
      } else {
        looping = false;
      }
    }

    function ensureLoop() {
      if (looping) return;
      looping = true;
      rafId = requestAnimationFrame(frame);
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const now = performance.now();
      ripples.push({ x: e.clientX, y: e.clientY, start: now });
      draw(now);
      ensureLoop();
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("pointerdown", onPointerDown);
    resize();

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", onPointerDown);
      if (resizeTimer) clearTimeout(resizeTimer);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas id="dot-field" ref={canvasRef} aria-hidden="true" />;
}
