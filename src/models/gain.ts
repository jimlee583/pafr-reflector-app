// First-order gain / directivity from combined aperture efficiency.
//
//   G = eta_ap * (pi * D / lambda)^2
//
// HPBW for a uniformly-illuminated circular aperture is 1.02 * lambda / D
// radians; taper broadens this slightly (we do not correct for taper in v1).

import type { GainResult } from "./types";

export function gainFromAperture(
  apertureEfficiency: number,
  diameterM: number,
  wavelengthM: number,
): GainResult {
  const kD = (Math.PI * diameterM) / wavelengthM;
  const directivityLinear = apertureEfficiency * kD * kD;
  const directivityDbi =
    directivityLinear > 0 ? 10 * Math.log10(directivityLinear) : -Infinity;
  const hpbwRad = (1.02 * wavelengthM) / diameterM;
  return {
    directivityLinear,
    directivityDbi,
    gainDbi: directivityDbi, // v1: lossless
    hpbwRad,
  };
}
