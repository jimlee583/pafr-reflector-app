import { describe, expect, it } from "vitest";
import { gainFromAperture } from "./gain";

describe("gainFromAperture", () => {
  it("scales as D^2 at fixed efficiency and wavelength", () => {
    const g1 = gainFromAperture(0.6, 1, 0.025);
    const g2 = gainFromAperture(0.6, 2, 0.025);
    // 4x aperture area -> +6 dB
    expect(g2.gainDbi - g1.gainDbi).toBeCloseTo(10 * Math.log10(4), 6);
  });

  it("HPBW shrinks with larger D", () => {
    const g1 = gainFromAperture(0.6, 1, 0.025);
    const g2 = gainFromAperture(0.6, 2, 0.025);
    expect(g2.hpbwRad).toBeLessThan(g1.hpbwRad);
  });

  it("matches G = eta * (pi D / lambda)^2 exactly", () => {
    const eta = 0.55;
    const D = 1.2;
    const lam = 0.03;
    const g = gainFromAperture(eta, D, lam);
    const expected = eta * (Math.PI * D / lam) ** 2;
    expect(g.directivityLinear).toBeCloseTo(expected, 6);
  });
});
