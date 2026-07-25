// Aperture-efficiency terms for a prime-focus paraboloid fed by an
// axisymmetric-equivalent feed pattern P(psi) = <|F(psi,phi)|^2>_phi.
//
// Using Silver's classic formulas (see Balanis, "Antenna Theory"):
//
//   eta_s = int_0^{psi_0} P(psi) sin(psi) dpsi / int_0^{pi} P(psi) sin(psi) dpsi
//
//   eta_t = 2 cot^2(psi_0/2) *
//           |int_0^{psi_0} sqrt(P(psi)) tan(psi/2) dpsi|^2 /
//           int_0^{psi_0} P(psi) sin(psi) dpsi
//
//   eta_ap_optical = eta_s * eta_t
//
// The normalization of P cancels, so we can use the un-normalized
// axisymmetric intensity directly.
//
// Blockage is treated as a simple central-shadow area loss:
//   eta_b = max(0, 1 - A_block / A_dish)^2

import { simpson } from "./integration";
import { feedIntensityAxi } from "./feed";
import type { Efficiencies, FeedInputs } from "./types";

const EPS = 1e-6;

export function spilloverEfficiency(
  feed: FeedInputs,
  rimHalfAngleRad: number,
): number {
  const captured = simpson(
    (psi) => feedIntensityAxi(psi, feed) * Math.sin(psi),
    EPS,
    rimHalfAngleRad,
    200,
  );
  const total = simpson(
    (psi) => feedIntensityAxi(psi, feed) * Math.sin(psi),
    EPS,
    Math.PI / 2, // element pattern kills the back hemisphere
    200,
  );
  if (total <= 0) return 0;
  return clamp01(captured / total);
}

export function illuminationEfficiency(
  feed: FeedInputs,
  rimHalfAngleRad: number,
): number {
  const num = simpson(
    (psi) => Math.sqrt(feedIntensityAxi(psi, feed)) * Math.tan(psi / 2),
    EPS,
    rimHalfAngleRad,
    200,
  );
  const den = simpson(
    (psi) => feedIntensityAxi(psi, feed) * Math.sin(psi),
    EPS,
    rimHalfAngleRad,
    200,
  );
  if (den <= 0) return 0;
  const cot = 1 / Math.tan(rimHalfAngleRad / 2);
  const eta = 2 * cot * cot * (num * num) / den;
  return clamp01(eta);
}

export function blockageEfficiency(
  apertureAreaM2: number,
  blockageAreaM2: number,
): number {
  if (apertureAreaM2 <= 0) return 0;
  const frac = Math.max(0, 1 - blockageAreaM2 / apertureAreaM2);
  return clamp01(frac * frac);
}

/**
 * Compute all efficiency terms in one shot.
 */
export function efficiencies(
  feed: FeedInputs,
  rimHalfAngleRad: number,
  apertureAreaM2: number,
  blockageAreaM2: number,
): Efficiencies {
  const spillover = spilloverEfficiency(feed, rimHalfAngleRad);
  const illumination = illuminationEfficiency(feed, rimHalfAngleRad);
  const blockage = blockageEfficiency(apertureAreaM2, blockageAreaM2);
  const aperture = spillover * illumination * blockage;
  return { spillover, illumination, blockage, aperture };
}

/**
 * Feed edge taper (voltage) in dB at the rim angle. Negative dB = rolled
 * off relative to on-axis. Includes the extra "space-loss" 1/rho^2 term.
 */
export function edgeTaperDb(
  feed: FeedInputs,
  rimHalfAngleRad: number,
): number {
  const p = feedIntensityAxi(rimHalfAngleRad, feed);
  if (p <= 0) return -60;
  // Feed pattern in dB relative to peak
  const patternDb = 10 * Math.log10(p);
  // Space-loss factor from focus to rim vs focus to vertex:
  // rho_rim / rho_vertex = 1 / cos^2(psi/2) ... but we express as dB penalty
  // Space loss in intensity is 1/rho^2. rho(psi)/rho(0) = 1 / cos^2(psi/2)
  // (since rho(0) = F and rho(psi) = 2F/(1+cos(psi)) = F/cos^2(psi/2)).
  const rhoRatio = 1 / Math.pow(Math.cos(rimHalfAngleRad / 2), 2);
  const spaceLossDb = -20 * Math.log10(rhoRatio);
  return patternDb + spaceLossDb;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
