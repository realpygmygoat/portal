"use client";

import { useId } from "react";

// The three-triangle motif from the portfolio site's wordmark: solid brass,
// striped sage, outlined — a small recurring graphic rather than a plain
// logotype. Ported from the original inline-SVG generator.
export function ChevronMark({ size = 20 }: { size?: number }) {
  const h = size;
  const w = Math.round((size * 66) / 34);
  const uid = useId();
  const stripeId = `chevron-stripe-${uid}`;
  const clipId = `chevron-clip-${uid}`;

  return (
    <svg width={w} height={h} viewBox="0 0 66 34" aria-hidden="true" className="shrink-0">
      <path d="M2 2 L22 17 L2 32 Z" fill="var(--brass)" />
      <pattern id={stripeId} x="0" y="2" width="5" height="5" patternUnits="userSpaceOnUse">
        <rect x="0" y="1.25" width="5" height="2.5" fill="var(--sage)" />
      </pattern>
      <path d="M24 2 L44 17 L24 32 Z" fill={`url(#${stripeId})`} />
      <clipPath id={clipId}>
        <path d="M46 2 L66 17 L46 32 Z" />
      </clipPath>
      <path
        d="M46 2 L66 17 L46 32 Z"
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth={4}
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}
