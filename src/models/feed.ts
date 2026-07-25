// ESA feed radiation model: element pattern * uniform rectangular array factor.
//
// Voltage pattern conventions:
//   E_element(theta)      = cos^n(theta), 0 for theta > pi/2
//   E_array(theta, phi)   = normalized 2-D sinc from a uniform NxN array
//   |F(theta, phi)|^2     = |E_element|^2 * |E_array|^2   (peak = 1 at boresight)
//
// The phi-averaged intensity is what feeds the axisymmetric spillover /
// illumination integrals over the circular reflector rim.

import { simpson } from "./integration";
import type { FeedGeometry, FeedInputs } from "./types";
import { wavelengthFromFrequency } from "./constants";

/**
 * Element voltage pattern cos^n(theta). Zero for theta >= pi/2 (no back
 * radiation).
 */
export function elementVoltage(thetaRad: number, n: number): number {
  const c = Math.cos(thetaRad);
  // Snap tiny cosines (e.g., Math.cos(pi/2) ~ 6e-17) to zero so the pattern
  // is truly zero at and beyond 90 deg regardless of the exponent.
  if (c <= 1e-12) return 0;
  return Math.pow(c, n);
}

/**
 * Array factor magnitude for a uniform 1-D array with N elements at pitch
 * d (in wavelengths). Angle argument is the u = sin(theta)*cos(phi) or the
 * corresponding projection. Peak = 1.
 *
 *   |AF(u)| = |sin(N * pi * d * u) / (N * sin(pi * d * u))|
 */
export function arrayFactor1D(u: number, N: number, dLambda: number): number {
  const x = Math.PI * dLambda * u;
  const denom = N * Math.sin(x);
  const num = Math.sin(N * x);
  if (Math.abs(denom) < 1e-12) return 1; // limit as x -> 0 (or grating-lobe peaks)
  return num / denom;
}

/**
 * Full 2-D radiation intensity |F(theta,phi)|^2 for the ESA feed.
 * Peak (theta = 0) = 1. Includes element pattern and array factor.
 */
export function feedIntensity(
  thetaRad: number,
  phiRad: number,
  feed: FeedInputs,
): number {
  const ev = elementVoltage(thetaRad, feed.elementCosExponentN);
  if (ev === 0) return 0;
  const s = Math.sin(thetaRad);
  const ux = s * Math.cos(phiRad);
  const uy = s * Math.sin(phiRad);
  const afx = arrayFactor1D(ux, feed.Nx, feed.dxLambda);
  const afy = arrayFactor1D(uy, feed.Ny, feed.dyLambda);
  const af = afx * afy;
  return ev * ev * af * af;
}

/**
 * Phi-averaged intensity <|F(theta,phi)|^2>_phi. Used for the axisymmetric
 * reflector integrals over a circular rim.
 */
export function feedIntensityAxi(
  thetaRad: number,
  feed: FeedInputs,
  nPhi: number = 32,
): number {
  // For a rectangular grid the pattern has 90-degree symmetry, so we only
  // need to average over phi in [0, pi/2] and it matches the full azimuth
  // average. Trapezoidal midpoint average is fine here.
  let sum = 0;
  for (let i = 0; i < nPhi; i++) {
    const phi = ((i + 0.5) / nPhi) * (Math.PI / 2);
    sum += feedIntensity(thetaRad, phi, feed);
  }
  return sum / nPhi;
}

/**
 * Peak feed directivity computed from the (phi-averaged) intensity:
 *   D_f = 4*pi * P_max / integral over sphere.
 * For our axisymmetric integrand, the integral reduces to
 *   2*pi * integral_{0}^{pi/2} P_axi(theta) sin(theta) dtheta
 * (element pattern kills the back hemisphere).
 */
export function feedPeakDirectivity(feed: FeedInputs): number {
  const totalPower =
    2 *
    Math.PI *
    simpson(
      (theta) => feedIntensityAxi(theta, feed) * Math.sin(theta),
      1e-6,
      Math.PI / 2,
      200,
    );
  if (totalPower <= 0) return 1;
  return (4 * Math.PI) / totalPower;
}

/**
 * Build all "feed geometry" outputs that the app displays.
 */
export function feedGeometry(
  feed: FeedInputs,
  frequencyHz: number,
): FeedGeometry {
  const wavelengthM = wavelengthFromFrequency(frequencyHz);
  const arraySizeXM = feed.Nx * feed.dxLambda * wavelengthM;
  const arraySizeYM = feed.Ny * feed.dyLambda * wavelengthM;
  const blockageAreaM2 = arraySizeXM * arraySizeYM;
  const peakDirectivity = feedPeakDirectivity(feed);
  // edge taper is filled in later when we know the rim angle
  return {
    arraySizeXM,
    arraySizeYM,
    blockageAreaM2,
    wavelengthM,
    peakDirectivity,
    edgeTaperDb: NaN,
  };
}
