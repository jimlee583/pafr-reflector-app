import { useMemo } from "react";
import { feedIntensityAxi } from "../models/feed";
import type { PAFRInputs, PAFRResult } from "../models/types";
import { fmtDb } from "./format";

interface Props {
  inputs: PAFRInputs;
  result: PAFRResult;
}

/**
 * Radial cut of the aperture illumination profile |E_ap(r)|^2 in dB
 * (relative to the peak). This is the "energy left on the dish", not the
 * feed pattern -- it includes both the axial pattern and the space-loss
 * factor from focus to reflector.
 *
 * Mapping from aperture radius r to focus angle psi:
 *   psi(r) = 2 * atan(r / (2F))
 * Space-loss factor (intensity):
 *   (1/rho)^2 = ((1 + cos(psi)) / (2F))^2
 *
 * So |E_ap(r)|^2 ~ P(psi) * ((1 + cos(psi)) / 2)^2 (dropping 1/F^2 which is
 * a constant; we display normalized to peak).
 */
export function IlluminationView({ inputs, result }: Props) {
  const D = result.reflector.diameterM;
  const F = result.reflector.focalLengthM;
  const psi0 = result.reflector.rimHalfAngleRad;
  const feed = inputs.feed;

  const { samples, edgeDb } = useMemo(() => {
    const N = 121;
    const rN: { r: number; dB: number }[] = [];
    let peak = -Infinity;
    for (let i = 0; i < N; i++) {
      const r = -D / 2 + (i / (N - 1)) * D;
      const psi = 2 * Math.atan(Math.abs(r) / (2 * F));
      const p = feedIntensityAxi(psi, feed);
      const rhoFactor = (1 + Math.cos(psi)) / 2; // rho_min/rho ratio
      const intensity = p * rhoFactor * rhoFactor;
      const dB = intensity > 1e-9 ? 10 * Math.log10(intensity) : -60;
      if (dB > peak) peak = dB;
      rN.push({ r, dB });
    }
    // Normalize to peak = 0 dB
    const normalized = rN.map(({ r, dB }) => ({ r, dB: dB - peak }));
    const edgePsi = psi0;
    const edgeP = feedIntensityAxi(edgePsi, feed);
    const edgeRho = (1 + Math.cos(edgePsi)) / 2;
    const edgeIntensity = edgeP * edgeRho * edgeRho;
    const edgeDb =
      edgeIntensity > 1e-9 ? 10 * Math.log10(edgeIntensity) - peak : -60;
    return { samples: normalized, edgeDb };
  }, [D, F, psi0, feed]);

  // Plot area
  const W = 620;
  const H = 220;
  const PAD_L = 44;
  const PAD_R = 12;
  const PAD_T = 8;
  const PAD_B = 24;
  const pw = W - PAD_L - PAD_R;
  const ph = H - PAD_T - PAD_B;

  const dbMin = -30;
  const dbMax = 2;

  const xFor = (r: number) =>
    PAD_L + ((r + D / 2) / D) * pw;
  const yFor = (dB: number) =>
    PAD_T + ((dbMax - clamp(dB, dbMin, dbMax)) / (dbMax - dbMin)) * ph;

  const line = samples
    .map(({ r, dB }, i) => `${i === 0 ? "M" : "L"} ${xFor(r).toFixed(2)},${yFor(dB).toFixed(2)}`)
    .join(" ");

  const gridDb = [0, -3, -10, -20, -30];

  return (
    <div className="illumination-view">
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid + axis labels */}
        {gridDb.map((db) => (
          <g key={db}>
            <line
              x1={PAD_L}
              y1={yFor(db)}
              x2={W - PAD_R}
              y2={yFor(db)}
              stroke="var(--border)"
              strokeDasharray="2 4"
            />
            <text
              x={PAD_L - 6}
              y={yFor(db) + 4}
              fontSize="10"
              fill="var(--text-dim)"
              textAnchor="end"
            >
              {db} dB
            </text>
          </g>
        ))}
        {/* Rim markers at r = +/- D/2 (edges of the plot) */}
        <line
          x1={xFor(-D / 2)}
          y1={PAD_T}
          x2={xFor(-D / 2)}
          y2={H - PAD_B}
          stroke="var(--warn)"
          strokeDasharray="4 3"
        />
        <line
          x1={xFor(D / 2)}
          y1={PAD_T}
          x2={xFor(D / 2)}
          y2={H - PAD_B}
          stroke="var(--warn)"
          strokeDasharray="4 3"
        />
        {/* Illumination curve */}
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {/* Edge-taper label */}
        <text
          x={xFor(D / 2) - 4}
          y={yFor(edgeDb) - 6}
          fontSize="11"
          fill="var(--accent)"
          textAnchor="end"
        >
          edge {fmtDb(edgeDb, 1)}
        </text>
        {/* X axis */}
        <line
          x1={PAD_L}
          y1={H - PAD_B}
          x2={W - PAD_R}
          y2={H - PAD_B}
          stroke="var(--border)"
        />
        <text
          x={xFor(-D / 2)}
          y={H - 6}
          fontSize="10"
          fill="var(--text-dim)"
          textAnchor="middle"
        >
          -D/2
        </text>
        <text
          x={xFor(0)}
          y={H - 6}
          fontSize="10"
          fill="var(--text-dim)"
          textAnchor="middle"
        >
          aperture radius
        </text>
        <text
          x={xFor(D / 2)}
          y={H - 6}
          fontSize="10"
          fill="var(--text-dim)"
          textAnchor="middle"
        >
          D/2
        </text>
      </svg>
    </div>
  );
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
