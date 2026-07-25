// Physical constants used across the models.

/** Speed of light in vacuum, m/s. */
export const C = 299_792_458;

/**
 * Convert frequency (Hz) to wavelength (m).
 */
export function wavelengthFromFrequency(frequencyHz: number): number {
  return C / frequencyHz;
}
