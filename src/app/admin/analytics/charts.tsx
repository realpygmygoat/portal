// Hand-rolled inline-SVG charts, following the house dataviz method: thin
// marks with 4px rounded data-ends squared at the baseline, direct value
// labels, recessive hairline gridlines/baseline, text never carries the
// series color (a swatch sits beside it instead). No chart library needed
// for two small internal charts.

function money(n: number) {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

// Single series -> the sequential default hue (blue), no legend needed:
// the chart's own title already says what's plotted.
const SEQUENTIAL_HUE = "#3987e5";

// Fixed categorical order, validated (CVD + contrast) against this app's
// dark surfaces via the dataviz skill's validator — never reorder per filter.
const CATEGORICAL = ["#3987e5", "#d95926", "#199e70", "#c98500"];

export function MonthlyCollectedChart({ data }: { data: { label: string; amount: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">No payments recorded yet.</p>;
  }

  const max = Math.max(...data.map((d) => d.amount), 1);
  const width = 640;
  const height = 220;
  const padLeft = 8;
  const padBottom = 28;
  const plotH = height - padBottom;
  const barSlot = (width - padLeft) / data.length;
  const barW = Math.min(24, barSlot * 0.5);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Payments collected per month">
      <line x1={padLeft} y1={plotH} x2={width} y2={plotH} stroke="var(--rule)" strokeWidth={1} />
      {data.map((d, i) => {
        const h = (d.amount / max) * (plotH - 28);
        const cx = padLeft + barSlot * i + barSlot / 2;
        const x = cx - barW / 2;
        const y = plotH - h;
        return (
          <g key={d.label}>
            <title>
              {d.label}: {money(d.amount)}
            </title>
            <path
              d={`M${x},${plotH} L${x},${y + 4} Q${x},${y} ${x + 4},${y} L${x + barW - 4},${y} Q${x + barW},${y} ${x + barW},${y + 4} L${x + barW},${plotH} Z`}
              fill={SEQUENTIAL_HUE}
            />
            {h > 16 && (
              <text x={cx} y={y - 6} textAnchor="middle" fontSize={10} className="fill-text-muted font-mono">
                {money(d.amount)}
              </text>
            )}
            <text x={cx} y={height - 8} textAnchor="middle" fontSize={10} className="fill-text-muted font-mono">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ServiceBreakdownChart({ data }: { data: { label: string; amount: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">No charges recorded yet.</p>;
  }

  // Fixed order caps at the palette's validated slot count — a 5th service
  // folds into "Other" rather than reusing/cycling a hue (see anti-patterns).
  const capped =
    data.length > CATEGORICAL.length
      ? [
          ...data.slice(0, CATEGORICAL.length - 1),
          {
            label: "Other",
            amount: data.slice(CATEGORICAL.length - 1).reduce((s, d) => s + d.amount, 0),
          },
        ]
      : data;

  const max = Math.max(...capped.map((d) => d.amount), 1);
  const rowH = 34;
  const width = 640;
  const height = capped.length * rowH;
  const labelW = 140;
  const plotW = width - labelW - 70;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Total charged per service">
        {capped.map((d, i) => {
          const color = CATEGORICAL[i % CATEGORICAL.length];
          const barH = 16;
          const w = Math.max((d.amount / max) * plotW, barH / 2);
          const topY = i * rowH + (rowH - barH) / 2;
          const bottomY = topY + barH;
          const r = 4;
          const swatchY = topY + barH / 2 - 4;
          const path =
            w <= r
              ? `M${labelW},${topY} L${labelW + w},${topY} L${labelW + w},${bottomY} L${labelW},${bottomY} Z`
              : `M${labelW},${topY} L${labelW + w - r},${topY} Q${labelW + w},${topY} ${labelW + w},${topY + r} L${labelW + w},${bottomY - r} Q${labelW + w},${bottomY} ${labelW + w - r},${bottomY} L${labelW},${bottomY} Z`;
          return (
            <g key={d.label}>
              <title>
                {d.label}: {money(d.amount)}
              </title>
              <rect x={0} y={swatchY} width={8} height={8} rx={2} fill={color} />
              <text x={16} y={topY + barH - 4} fontSize={12} className="fill-text">
                {d.label.length > 16 ? d.label.slice(0, 15) + "…" : d.label}
              </text>
              <path d={path} fill={color} />
              <text x={labelW + w + 8} y={topY + barH - 4} fontSize={11} className="fill-text-muted font-mono">
                {money(d.amount)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
