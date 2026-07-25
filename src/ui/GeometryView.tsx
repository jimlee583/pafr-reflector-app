import { useMemo } from "react";
import { parabolaZ } from "../models/geometry";
import type { PAFRResult } from "../models/types";
import { fmtDeg, fmtMeters } from "./format";

interface Props {
  result: PAFRResult;
  feedScanAngleRad: number;
}

/**
 * Side-view of the paraboloid: dish, focus, ESA feed, rim rays, and the
 * electronically-scanned beam direction. Purely SVG so it scales with the
 * container.
 *
 * World coordinates:
 *   z-axis horizontal (dish axis; +z points toward the sky)
 *   x-axis vertical (radial)
 *
 * Origin = dish vertex.
 * Focus at (z = F, x = 0). Rim points at (D^2/(16F), +/- D/2).
 */
export function GeometryView({ result, feedScanAngleRad }: Props) {
  const {
    reflector: { diameterM: D, focalLengthM: F, rimHalfAngleRad: psi0, depthM },
    feed: { arraySizeXM },
    scan: { skyBeamAngleRad },
  } = result;

  const path = useMemo(() => {
    const nSeg = 60;
    const pts: string[] = [];
    for (let i = 0; i <= nSeg; i++) {
      const t = i / nSeg;
      const r = -D / 2 + t * D;
      const z = parabolaZ(r, F);
      pts.push(`${z.toFixed(4)},${r.toFixed(4)}`);
    }
    return "M " + pts.join(" L ");
  }, [D, F]);

  // Compute world-space bounding box for the drawing.
  const zMin = -0.15 * F;
  const zMax = Math.max(F, depthM) * 1.35;
  const xExtent = (D / 2) * 1.25;

  const worldW = zMax - zMin;
  const worldH = 2 * xExtent;
  const PAD = 12;
  const targetW = 620;
  const scale = (targetW - 2 * PAD) / worldW;

  const w2s = (z: number, x: number) => {
    // world -> svg (svg y is down, so flip x)
    const sx = PAD + (z - zMin) * scale;
    const sy = PAD + (xExtent - x) * scale;
    return { sx, sy };
  };

  const svgW = targetW;
  const svgH = worldH * scale + 2 * PAD;

  const vertex = w2s(0, 0);
  const focus = w2s(F, 0);
  const rimTop = w2s(depthM, D / 2);
  const rimBot = w2s(depthM, -D / 2);

  // Rim rays
  const rimRayTop = `M ${focus.sx},${focus.sy} L ${rimTop.sx},${rimTop.sy}`;
  const rimRayBot = `M ${focus.sx},${focus.sy} L ${rimBot.sx},${rimBot.sy}`;

  // psi_0 arc from top-rim ray down to axis, near focus.
  // Arc goes from angle 180deg (toward vertex, -z direction) to angle
  // 180 - psi0 (rotated up by psi0 toward the top rim).
  const arcR = 32;
  const a1 = Math.PI; // toward vertex (-z direction)
  const a2 = Math.PI - psi0; // toward top rim (rotated up by psi0 in svg y-up sense)
  const arcP1 = {
    sx: focus.sx + arcR * Math.cos(a1),
    sy: focus.sy - arcR * Math.sin(a1),
  };
  const arcP2 = {
    sx: focus.sx + arcR * Math.cos(a2),
    sy: focus.sy - arcR * Math.sin(a2),
  };
  const arcPath = `M ${arcP1.sx.toFixed(2)},${arcP1.sy.toFixed(2)} A ${arcR},${arcR} 0 0 1 ${arcP2.sx.toFixed(2)},${arcP2.sy.toFixed(2)}`;

  // ESA feed box: centered at focus, "thickness" ~ 0.06 F along z, size = arraySizeXM in x
  const feedHalfX = Math.min(arraySizeXM / 2, D * 0.4);
  const feedHalfZ = Math.max(0.03 * F, 0.02 * D);
  const feedTL = w2s(F - feedHalfZ, feedHalfX);
  const feedBR = w2s(F + feedHalfZ, -feedHalfX);

  // Electronically-scanned sky beam: draw as an outgoing arrow from
  // the aperture area at angle skyBeamAngleRad off +z.
  const beamStart = w2s(depthM * 0.6, 0);
  const beamLenWorld = 0.6 * F;
  const beamEnd = w2s(
    depthM * 0.6 + beamLenWorld * Math.cos(skyBeamAngleRad),
    beamLenWorld * Math.sin(skyBeamAngleRad),
  );

  // Feed scan direction (indicating electronic tilt inside the ESA):
  const feedScanLenWorld = 0.35 * F;
  const feedScanEnd = w2s(
    F - feedScanLenWorld * Math.cos(feedScanAngleRad),
    -feedScanLenWorld * Math.sin(feedScanAngleRad),
  );

  return (
    <div className="geometry-view">
      <svg
        width="100%"
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Axis of symmetry */}
        <line
          x1={PAD}
          y1={vertex.sy}
          x2={svgW - PAD}
          y2={vertex.sy}
          stroke="var(--border)"
          strokeDasharray="4 4"
        />
        {/* Aperture plane */}
        <line
          x1={rimTop.sx}
          y1={rimTop.sy}
          x2={rimBot.sx}
          y2={rimBot.sy}
          stroke="var(--border)"
          strokeDasharray="2 4"
        />
        {/* Dish */}
        <path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
          transform={`translate(${PAD - zMin * scale}, ${PAD + xExtent * scale}) scale(${scale}, ${-scale})`}
        />
        {/* Rim rays */}
        <path d={rimRayTop} stroke="var(--text-dim)" strokeDasharray="3 3" fill="none" />
        <path d={rimRayBot} stroke="var(--text-dim)" strokeDasharray="3 3" fill="none" />
        {/* psi_0 arc */}
        <path d={arcPath} fill="none" stroke="var(--accent-2)" strokeWidth={1.5} />
        <text
          x={focus.sx - arcR - 10}
          y={focus.sy - arcR / 3}
          fill="var(--accent-2)"
          fontSize="11"
          textAnchor="end"
        >
          ψ₀ = {fmtDeg(psi0, 1)}
        </text>
        {/* Focus marker */}
        <circle cx={focus.sx} cy={focus.sy} r={3} fill="var(--warn)" />
        <text x={focus.sx + 6} y={focus.sy - 6} fill="var(--warn)" fontSize="11">
          focus
        </text>
        {/* Vertex marker */}
        <circle cx={vertex.sx} cy={vertex.sy} r={2} fill="var(--text-dim)" />
        {/* ESA feed box */}
        <rect
          x={Math.min(feedTL.sx, feedBR.sx)}
          y={Math.min(feedTL.sy, feedBR.sy)}
          width={Math.abs(feedBR.sx - feedTL.sx)}
          height={Math.abs(feedBR.sy - feedTL.sy)}
          fill="var(--panel-2)"
          stroke="var(--accent-2)"
          strokeWidth={1.5}
        />
        {/* Feed electronic-scan indicator (tilt vector from focus) */}
        {Math.abs(feedScanAngleRad) > 1e-4 && (
          <line
            x1={focus.sx}
            y1={focus.sy}
            x2={feedScanEnd.sx}
            y2={feedScanEnd.sy}
            stroke="var(--accent-2)"
            strokeWidth={1.5}
            markerEnd="url(#arrowGreen)"
          />
        )}
        {/* Sky beam */}
        <line
          x1={beamStart.sx}
          y1={beamStart.sy}
          x2={beamEnd.sx}
          y2={beamEnd.sy}
          stroke="var(--accent)"
          strokeWidth={2}
          markerEnd="url(#arrowBlue)"
        />
        <text x={beamEnd.sx + 4} y={beamEnd.sy - 4} fill="var(--accent)" fontSize="11">
          sky beam {fmtDeg(skyBeamAngleRad, 1)}
        </text>

        {/* Diameter label */}
        <text
          x={rimTop.sx + 8}
          y={rimTop.sy - 4}
          fill="var(--text-dim)"
          fontSize="11"
        >
          D = {fmtMeters(D)}
        </text>
        <text
          x={rimBot.sx + 8}
          y={rimBot.sy + 12}
          fill="var(--text-dim)"
          fontSize="11"
        >
          f/D = {result.reflector.fOverD.toFixed(2)}, F = {fmtMeters(F)}
        </text>

        {/* Arrowhead defs */}
        <defs>
          <marker
            id="arrowBlue"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
          </marker>
          <marker
            id="arrowGreen"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-2)" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
