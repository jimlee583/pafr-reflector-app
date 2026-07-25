// Shared input / output types for the PAFR model layer.
//
// All lengths are SI (meters), frequencies in Hz, angles in radians unless
// a name explicitly says otherwise (e.g., *_deg).

export interface ReflectorInputs {
  /** Aperture diameter, m. */
  diameterM: number;
  /** Focal-length-to-diameter ratio, f/D. */
  fOverD: number;
}

export interface FeedInputs {
  /** Number of elements along x. */
  Nx: number;
  /** Number of elements along y. */
  Ny: number;
  /** Element pitch along x, in wavelengths. */
  dxLambda: number;
  /** Element pitch along y, in wavelengths. */
  dyLambda: number;
  /**
   * Element pattern exponent n such that the element voltage pattern is
   * cos^n(theta). n = 1 is a cos element (Huygens-like), n = 1.5-2 is closer
   * to a patch on a ground plane.
   */
  elementCosExponentN: number;
  /**
   * Uniform amplitude only in v1 (extension point: taper params).
   */
  amplitudeTaper: "uniform";
}

export interface RFInputs {
  /** Operating frequency, Hz. */
  frequencyHz: number;
}

export interface ScanInputs {
  /** Electronic scan angle of the ESA feed off boresight, radians. */
  feedScanAngleRad: number;
}

export interface PAFRInputs {
  reflector: ReflectorInputs;
  feed: FeedInputs;
  rf: RFInputs;
  scan: ScanInputs;
}

export interface ReflectorGeometry {
  /** f/D. */
  fOverD: number;
  /** Diameter D, m. */
  diameterM: number;
  /** Focal length F, m. */
  focalLengthM: number;
  /** Rim half-angle psi_0, rad. */
  rimHalfAngleRad: number;
  /** Depth of the dish (vertex-to-rim distance along axis), m. */
  depthM: number;
  /** Slant distance from focus to rim, m. */
  focusToRimM: number;
  /** Aperture area, m^2. */
  apertureAreaM2: number;
}

export interface FeedGeometry {
  /** Physical size of the array (approx Nx*dx * lambda), m. */
  arraySizeXM: number;
  arraySizeYM: number;
  /** Blockage area (rectangular footprint), m^2. */
  blockageAreaM2: number;
  /** Wavelength, m. */
  wavelengthM: number;
  /** Peak directivity of the feed, dimensionless (linear). */
  peakDirectivity: number;
  /**
   * Feed edge taper at the reflector rim (dB, negative = rolled off).
   * Computed from the axisymmetric feed pattern at psi = rim_half_angle.
   */
  edgeTaperDb: number;
}

export interface Efficiencies {
  /** Spillover efficiency (0..1). Fraction of feed power on the dish. */
  spillover: number;
  /** Illumination / taper efficiency (0..1). */
  illumination: number;
  /** Blockage efficiency (0..1). */
  blockage: number;
  /** Combined aperture efficiency (0..1). */
  aperture: number;
}

export interface GainResult {
  /** Peak directivity (broadside), linear. */
  directivityLinear: number;
  /** Peak directivity in dBi. */
  directivityDbi: number;
  /** Gain (= directivity here, assumes lossless), dBi. */
  gainDbi: number;
  /** Half-power beamwidth, radians (first-order, 1.02*lambda/D). */
  hpbwRad: number;
}

export interface ScanResult {
  /** Beam Deviation Factor (dimensionless). */
  beamDeviationFactor: number;
  /** Sky beam angle produced by the feed scan, radians. */
  skyBeamAngleRad: number;
  /** Loss from ESA element pattern at scan angle, dB (positive = loss). */
  elementLossDb: number;
  /** Coma / defocus loss (heuristic), dB. */
  comaLossDb: number;
  /** Total scan loss, dB. */
  totalScanLossDb: number;
  /** Scanned gain, dBi (broadside gain - total scan loss). */
  scannedGainDbi: number;
}

export interface GratingResult {
  /** Largest element pitch in wavelengths (max of dx, dy). */
  maxPitchLambda: number;
  /**
   * Maximum scan angle that avoids grating lobes in visible space, radians.
   * Returns pi/2 if unconstrained (pitch <= 0.5 lambda).
   */
  maxScanBeforeGratingRad: number;
  /** True if the current scan angle is grating-lobe safe. */
  currentScanSafe: boolean;
}

export interface PAFRResult {
  wavelengthM: number;
  reflector: ReflectorGeometry;
  feed: FeedGeometry;
  efficiencies: Efficiencies;
  gain: GainResult;
  scan: ScanResult;
  grating: GratingResult;
}
