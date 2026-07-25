import type { PAFRResult } from "../models/types";
import {
  fmtDb,
  fmtDbi,
  fmtDeg,
  fmtMeters,
  fmtNumber,
  fmtPct,
} from "./format";

interface Props {
  result: PAFRResult;
}

interface Card {
  label: string;
  value: string;
  detail?: string;
  tone?: "good" | "warn" | "bad" | "neutral";
}

export function KpiCards({ result }: Props) {
  const cards: Card[] = [
    {
      label: "Gain (broadside)",
      value: fmtDbi(result.gain.gainDbi),
      detail: `D = ${result.gain.directivityLinear.toExponential(2)}`,
      tone: "good",
    },
    {
      label: "Aperture efficiency",
      value: fmtPct(result.efficiencies.aperture),
      detail: `spillover \u00d7 taper \u00d7 blockage`,
    },
    {
      label: "Spillover eff.",
      value: fmtPct(result.efficiencies.spillover),
      detail: `rim @ ${fmtDeg(result.reflector.rimHalfAngleRad, 1)}`,
    },
    {
      label: "Illumination eff.",
      value: fmtPct(result.efficiencies.illumination),
      detail: `edge taper ${fmtDb(result.feed.edgeTaperDb, 1)}`,
    },
    {
      label: "Blockage eff.",
      value: fmtPct(result.efficiencies.blockage),
      detail: `array ${fmtMeters(result.feed.arraySizeXM)} \u00d7 ${fmtMeters(
        result.feed.arraySizeYM,
      )}`,
    },
    {
      label: "HPBW",
      value: fmtDeg(result.gain.hpbwRad, 3),
      detail: "1.02 \u03bb / D",
    },
    {
      label: "Scan loss (total)",
      value: fmtDb(result.scan.totalScanLossDb, 2),
      detail: `elem ${fmtDb(result.scan.elementLossDb, 2)} + coma ${fmtDb(
        result.scan.comaLossDb,
        2,
      )}`,
      tone: toneForScanLoss(result.scan.totalScanLossDb),
    },
    {
      label: "Sky beam angle",
      value: fmtDeg(result.scan.skyBeamAngleRad, 2),
      detail: `BDF = ${fmtNumber(result.scan.beamDeviationFactor, 3)}`,
    },
    {
      label: "Scanned gain",
      value: fmtDbi(result.scan.scannedGainDbi),
      detail: "gain \u2212 total scan loss",
      tone: "good",
    },
    {
      label: "Grating-lobe safe scan",
      value:
        result.grating.maxScanBeforeGratingRad >= Math.PI / 2 - 1e-9
          ? "unlimited"
          : fmtDeg(result.grating.maxScanBeforeGratingRad, 1),
      detail: `d_max = ${fmtNumber(
        result.grating.maxPitchLambda,
        2,
      )} \u03bb${result.grating.currentScanSafe ? "" : " \u2014 CURRENT SCAN UNSAFE"}`,
      tone: result.grating.currentScanSafe ? "neutral" : "bad",
    },
    {
      label: "Feed directivity",
      value: fmtDbi(10 * Math.log10(result.feed.peakDirectivity)),
      detail: `wavelength = ${fmtMeters(result.wavelengthM)}`,
    },
    {
      label: "Reflector focal length",
      value: fmtMeters(result.reflector.focalLengthM),
      detail: `depth = ${fmtMeters(result.reflector.depthM)}`,
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((c) => (
        <div key={c.label} className={`kpi ${c.tone ?? "neutral"}`}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value">{c.value}</div>
          {c.detail && <div className="kpi-detail">{c.detail}</div>}
        </div>
      ))}
    </div>
  );
}

function toneForScanLoss(dB: number): Card["tone"] {
  if (dB < 0.5) return "good";
  if (dB < 3) return "warn";
  return "bad";
}
