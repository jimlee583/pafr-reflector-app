import type { PAFRInputs } from "../models/types";

/**
 * Nominal defaults that produce an interesting first-open picture:
 * Ku-band, 1 m dish at f/D = 0.4, modest 8x8 ESA at half-lambda spacing.
 */
export const DEFAULT_INPUTS: PAFRInputs = {
  reflector: { diameterM: 1.0, fOverD: 0.4 },
  feed: {
    Nx: 8,
    Ny: 8,
    dxLambda: 0.5,
    dyLambda: 0.5,
    elementCosExponentN: 1.5,
    amplitudeTaper: "uniform",
  },
  rf: { frequencyHz: 12e9 },
  scan: { feedScanAngleRad: 0 },
};
