import { useMemo } from "react";
import { computePAFR } from "../models";
import type { PAFRInputs } from "../models/types";
import { LinePlot } from "./LinePlot";

interface Props {
  inputs: PAFRInputs;
}

export function TradePlots({ inputs }: Props) {
  const vsFOverD = useMemo(() => sweepFOverD(inputs), [inputs]);
  const vsScan = useMemo(() => sweepScan(inputs), [inputs]);
  const vsN = useMemo(() => sweepArraySize(inputs), [inputs]);

  return (
    <div className="trade-plots">
      <div className="trade-plot">
        <h3>Efficiency vs f/D</h3>
        <LinePlot
          series={[
            {
              label: "spillover",
              color: "var(--accent-2)",
              points: vsFOverD.map((p) => ({ x: p.fOverD, y: p.spillover })),
            },
            {
              label: "illumination",
              color: "var(--warn)",
              points: vsFOverD.map((p) => ({ x: p.fOverD, y: p.illumination })),
            },
            {
              label: "aperture",
              color: "var(--accent)",
              points: vsFOverD.map((p) => ({ x: p.fOverD, y: p.aperture })),
            },
          ]}
          xLabel="f/D"
          yLabel="efficiency"
          xLimits={[0.25, 2.0]}
          yLimits={[0, 1]}
          markerX={inputs.reflector.fOverD}
          formatX={(v) => v.toFixed(2)}
          formatY={(v) => v.toFixed(1)}
        />
        <p className="explain">
          Deeper dishes (small f/D) intercept more of the feed pattern
          (spillover &uarr;) but see a more tapered aperture field
          (illumination &darr;). Their product &mdash; aperture efficiency
          &mdash; peaks somewhere in between. Bigger ESA feeds narrow the
          pattern and push that peak toward shallower dishes.
        </p>
      </div>

      <div className="trade-plot">
        <h3>Scan loss vs feed scan angle</h3>
        <LinePlot
          series={[
            {
              label: "element loss",
              color: "var(--warn)",
              points: vsScan.map((p) => ({ x: p.scanDeg, y: p.elemDb })),
            },
            {
              label: "coma loss",
              color: "var(--accent-2)",
              points: vsScan.map((p) => ({ x: p.scanDeg, y: p.comaDb })),
            },
            {
              label: "total loss",
              color: "var(--accent)",
              points: vsScan.map((p) => ({ x: p.scanDeg, y: p.totalDb })),
            },
          ]}
          xLabel="feed scan angle [deg]"
          yLabel="loss [dB]"
          yLimits={[0, 10]}
          markerX={(inputs.scan.feedScanAngleRad * 180) / Math.PI}
          formatX={(v) => v.toFixed(0)}
          formatY={(v) => v.toFixed(1)}
        />
        <p className="explain">
          Two mechanisms fight electronic scan: the ESA element pattern rolls
          off as cos<sup>{(2 * inputs.feed.elementCosExponentN).toFixed(1)}</sup>(&theta;)
          and the reflector coma / defocus grows quadratically with scanned
          beamwidths. Deeper dishes coma faster; larger arrays have narrower
          beams so a given angular offset spans more beamwidths.
        </p>
      </div>

      <div className="trade-plot">
        <h3>Gain vs array size (N &times; N)</h3>
        <LinePlot
          series={[
            {
              label: "gain",
              color: "var(--accent)",
              points: vsN.map((p) => ({ x: p.N, y: p.gainDbi })),
            },
            {
              label: "blockage limit",
              color: "var(--bad)",
              points: vsN.map((p) => ({ x: p.N, y: p.gainDbi + p.blockageDb })),
              dash: "4 3",
            },
          ]}
          xLabel="N (square array)"
          yLabel="dBi"
          markerX={inputs.feed.Nx}
          formatX={(v) => v.toFixed(0)}
          formatY={(v) => v.toFixed(0)}
        />
        <p className="explain">
          Growing the ESA narrows the feed pattern, which raises spillover
          efficiency and lets you use a shallower reflector, but it also
          grows the physical shadow the feed casts on the aperture. The
          dashed line shows what the gain would be without blockage &mdash;
          the gap between the two curves is the blockage penalty for the
          current f/D and frequency.
        </p>
      </div>
    </div>
  );
}

function sweepFOverD(inputs: PAFRInputs) {
  const N = 41;
  const out: {
    fOverD: number;
    spillover: number;
    illumination: number;
    aperture: number;
  }[] = [];
  for (let i = 0; i < N; i++) {
    const fOverD = 0.25 + (i / (N - 1)) * (2.0 - 0.25);
    const r = computePAFR({
      ...inputs,
      reflector: { ...inputs.reflector, fOverD },
    });
    out.push({
      fOverD,
      spillover: r.efficiencies.spillover,
      illumination: r.efficiencies.illumination,
      aperture: r.efficiencies.aperture,
    });
  }
  return out;
}

function sweepScan(inputs: PAFRInputs) {
  const N = 41;
  const maxDeg = 30;
  const out: {
    scanDeg: number;
    elemDb: number;
    comaDb: number;
    totalDb: number;
  }[] = [];
  for (let i = 0; i < N; i++) {
    const scanDeg = (i / (N - 1)) * maxDeg;
    const r = computePAFR({
      ...inputs,
      scan: { feedScanAngleRad: (scanDeg * Math.PI) / 180 },
    });
    out.push({
      scanDeg,
      elemDb: r.scan.elementLossDb,
      comaDb: r.scan.comaLossDb,
      totalDb: r.scan.totalScanLossDb,
    });
  }
  return out;
}

function sweepArraySize(inputs: PAFRInputs) {
  const Ns = [2, 3, 4, 6, 8, 12, 16, 20, 24, 32];
  const out: {
    N: number;
    gainDbi: number;
    /** dB back-out to get "no-blockage" gain. */
    blockageDb: number;
  }[] = [];
  for (const N of Ns) {
    const r = computePAFR({
      ...inputs,
      feed: { ...inputs.feed, Nx: N, Ny: N },
    });
    const blockageDb =
      r.efficiencies.blockage > 0
        ? -10 * Math.log10(r.efficiencies.blockage)
        : 30;
    out.push({ N, gainDbi: r.gain.gainDbi, blockageDb });
  }
  return out;
}
