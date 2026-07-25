// Parabolic reflector geometry (prime-focus, symmetric paraboloid).

import type { ReflectorGeometry, ReflectorInputs } from "./types";

/**
 * Compute all first-order reflector geometry from D and f/D.
 *
 * Rim half-angle for a paraboloid: psi_0 = 2 * atan(1 / (4 * (f/D))).
 * Depth at vertex: D^2 / (16 F).
 * Polar equation (from focus): rho(psi) = 2F / (1 + cos(psi)).
 */
export function reflectorGeometry(inputs: ReflectorInputs): ReflectorGeometry {
  const { diameterM: D, fOverD } = inputs;
  if (D <= 0) throw new Error("diameterM must be > 0");
  if (fOverD <= 0) throw new Error("fOverD must be > 0");

  const F = fOverD * D;
  const psi0 = 2 * Math.atan(1 / (4 * fOverD));
  const depth = (D * D) / (16 * F);
  const focusToRim = (2 * F) / (1 + Math.cos(psi0));
  const aperture = Math.PI * (D / 2) * (D / 2);

  return {
    fOverD,
    diameterM: D,
    focalLengthM: F,
    rimHalfAngleRad: psi0,
    depthM: depth,
    focusToRimM: focusToRim,
    apertureAreaM2: aperture,
  };
}

/**
 * Parabola z(r) = r^2 / (4F), used for drawing the side-view.
 */
export function parabolaZ(rM: number, focalLengthM: number): number {
  return (rM * rM) / (4 * focalLengthM);
}
