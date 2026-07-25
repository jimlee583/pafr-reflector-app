// Electronic-scan behavior of a phased-array feed illuminating a
// prime-focus paraboloid. All formulas here are first-order / heuristic.
//
// - Beam Deviation Factor (BDF): commonly used empirical form
//     BDF = (1 + 0.36 * q^2) / (1 + q^2),  q = D / (4F) = 1 / (4 * f/D)
//   (Lo & others). BDF -> 1 for long-focus (shallow) dishes and drops
//   toward ~0.7-0.8 for deep dishes (f/D ~ 0.3).
//
// - Element pattern loss at scan angle: -20*n*log10(cos(theta_scan)) dB
//   (comes from |cos^n(theta_scan)|^2).
//
// - Coma / defocus loss: quadratic in beamwidths scanned; coefficient
//   scaled with 1/(f/D)^2 to reflect that deeper dishes coma faster.
//   This is heuristic; the app labels it as such.

import type { GainResult, ReflectorGeometry, ScanResult } from "./types";

export function beamDeviationFactor(fOverD: number): number {
  const q = 1 / (4 * fOverD);
  return (1 + 0.36 * q * q) / (1 + q * q);
}

/**
 * Coefficient for the coma-loss model. Tuned so a "moderate" f/D = 0.4
 * gives roughly ~1 dB at 3 HPBWs of scan; deeper dishes get penalized.
 */
export function comaCoefficient(fOverD: number): number {
  const q = 1 / (4 * fOverD);
  return 0.05 + 0.15 * q * q;
}

export function scanPerformance(
  feedScanAngleRad: number,
  elementCosExponentN: number,
  reflector: ReflectorGeometry,
  gain: GainResult,
): ScanResult {
  const bdf = beamDeviationFactor(reflector.fOverD);
  const skyBeamAngleRad = feedScanAngleRad * bdf;

  const cosT = Math.cos(Math.abs(feedScanAngleRad));
  const elemVoltage = cosT > 0 ? Math.pow(cosT, elementCosExponentN) : 0;
  const elemPower = elemVoltage * elemVoltage;
  const elementLossDb =
    elemPower > 1e-9 ? -10 * Math.log10(elemPower) : 60;

  const beamwidths = gain.hpbwRad > 0 ? skyBeamAngleRad / gain.hpbwRad : 0;
  const comaLossDb = comaCoefficient(reflector.fOverD) * beamwidths * beamwidths;

  const totalScanLossDb = elementLossDb + comaLossDb;
  const scannedGainDbi = gain.gainDbi - totalScanLossDb;

  return {
    beamDeviationFactor: bdf,
    skyBeamAngleRad,
    elementLossDb,
    comaLossDb,
    totalScanLossDb,
    scannedGainDbi,
  };
}
