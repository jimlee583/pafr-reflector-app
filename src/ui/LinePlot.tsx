// Minimal multi-series SVG line plot. Keeps us dependency-free.

export interface Series {
  label: string;
  color: string;
  points: { x: number; y: number }[];
  /** Optional style override, e.g. "3 3" for dashed. */
  dash?: string;
}

interface Props {
  series: Series[];
  xLabel: string;
  yLabel: string;
  /** If provided, forces axis limits; else auto from data. */
  xLimits?: [number, number];
  yLimits?: [number, number];
  /** Draw a vertical guide line at this x (e.g. current input value). */
  markerX?: number;
  height?: number;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
}

export function LinePlot({
  series,
  xLabel,
  yLabel,
  xLimits,
  yLimits,
  markerX,
  height = 200,
  formatX = (v) => v.toFixed(2),
  formatY = (v) => v.toFixed(2),
}: Props) {
  const allX = series.flatMap((s) => s.points.map((p) => p.x));
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const [xMin, xMax] = xLimits ?? niceRange(Math.min(...allX), Math.max(...allX));
  const [yMin, yMax] = yLimits ?? niceRange(Math.min(...allY), Math.max(...allY));

  const W = 620;
  const H = height;
  const PAD_L = 44;
  const PAD_R = 12;
  const PAD_T = 8;
  const PAD_B = 40; // room for x-label + legend
  const pw = W - PAD_L - PAD_R;
  const ph = H - PAD_T - PAD_B;

  const xFor = (x: number) =>
    PAD_L + ((x - xMin) / (xMax - xMin)) * pw;
  const yFor = (y: number) =>
    PAD_T + ((yMax - y) / (yMax - yMin)) * ph;

  const xTicks = ticks(xMin, xMax, 5);
  const yTicks = ticks(yMin, yMax, 4);

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="line-plot"
    >
      {/* Gridlines + y-axis ticks */}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line
            x1={PAD_L}
            y1={yFor(t)}
            x2={W - PAD_R}
            y2={yFor(t)}
            stroke="var(--border)"
            strokeDasharray="2 4"
          />
          <text
            x={PAD_L - 6}
            y={yFor(t) + 3}
            textAnchor="end"
            fontSize="10"
            fill="var(--text-dim)"
          >
            {formatY(t)}
          </text>
        </g>
      ))}
      {/* X ticks */}
      {xTicks.map((t) => (
        <g key={`x${t}`}>
          <line
            x1={xFor(t)}
            y1={PAD_T}
            x2={xFor(t)}
            y2={H - PAD_B}
            stroke="var(--border)"
            strokeDasharray="2 4"
          />
          <text
            x={xFor(t)}
            y={H - PAD_B + 12}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-dim)"
          >
            {formatX(t)}
          </text>
        </g>
      ))}
      {/* Axis labels */}
      <text
        x={(PAD_L + W - PAD_R) / 2}
        y={H - 4}
        textAnchor="middle"
        fontSize="11"
        fill="var(--text-dim)"
      >
        {xLabel}
      </text>
      <text
        x={-H / 2}
        y={12}
        transform={`rotate(-90)`}
        textAnchor="middle"
        fontSize="11"
        fill="var(--text-dim)"
      >
        {yLabel}
      </text>

      {/* Marker line at current input */}
      {markerX !== undefined && markerX >= xMin && markerX <= xMax && (
        <line
          x1={xFor(markerX)}
          y1={PAD_T}
          x2={xFor(markerX)}
          y2={H - PAD_B}
          stroke="var(--warn)"
          strokeDasharray="4 3"
        />
      )}

      {/* Series */}
      {series.map((s) => (
        <path
          key={s.label}
          d={s.points
            .map(
              (p, i) =>
                `${i === 0 ? "M" : "L"} ${xFor(p.x).toFixed(2)},${yFor(p.y).toFixed(2)}`,
            )
            .join(" ")}
          fill="none"
          stroke={s.color}
          strokeWidth={2}
          strokeDasharray={s.dash}
        />
      ))}

      {/* Legend */}
      <g>
        {series.map((s, i) => (
          <g key={s.label} transform={`translate(${PAD_L + i * 140}, ${H - 20})`}>
            <line
              x1={0}
              y1={0}
              x2={16}
              y2={0}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dash}
            />
            <text x={20} y={4} fontSize="11" fill="var(--text)">
              {s.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function niceRange(a: number, b: number): [number, number] {
  if (a === b) return [a - 1, a + 1];
  const pad = (b - a) * 0.05;
  return [a - pad, b + pad];
}

function ticks(a: number, b: number, n: number): number[] {
  const step = niceStep((b - a) / n);
  const start = Math.ceil(a / step) * step;
  const out: number[] = [];
  for (let v = start; v <= b + 1e-9; v += step) {
    out.push(Number(v.toFixed(10)));
  }
  return out;
}

function niceStep(raw: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  let nice;
  if (norm < 1.5) nice = 1;
  else if (norm < 3) nice = 2;
  else if (norm < 7) nice = 5;
  else nice = 10;
  return nice * mag;
}
