import { describe, expect, it } from "vitest";
import { reflectorGeometry } from "./geometry";
import { beamDeviationFactor, comaCoefficient, scanPerformance } from "./scan";
import type { GainResult } from "./types";

describe("beamDeviationFactor", () => {
  it("is < 1 for any physical dish", () => {
    for (const fOverD of [0.25, 0.3, 0.4, 0.5, 1.0, 2.0]) {
      const b = beamDeviationFactor(fOverD);
      expect(b).toBeGreaterThan(0);
      expect(b).toBeLessThanOrEqual(1);
    }
  });

  it("approaches 1 for shallow dishes (large f/D)", () => {
    expect(beamDeviationFactor(5)).toBeGreaterThan(0.99);
  });

  it("is lower for deeper dishes (small f/D)", () => {
    expect(beamDeviationFactor(0.3)).toBeLessThan(beamDeviationFactor(1.0));
  });
});

describe("comaCoefficient", () => {
  it("is larger for deeper dishes", () => {
    expect(comaCoefficient(0.3)).toBeGreaterThan(comaCoefficient(1.0));
  });
});

describe("scanPerformance", () => {
  const geom = reflectorGeometry({ diameterM: 1, fOverD: 0.4 });
  const gain: GainResult = {
    directivityLinear: 5000,
    directivityDbi: 37,
    gainDbi: 37,
    hpbwRad: (1.02 * 0.025) / 1,
  };

  it("returns zero loss at zero scan", () => {
    const s = scanPerformance(0, 1.5, geom, gain);
    expect(s.elementLossDb).toBeCloseTo(0, 6);
    expect(s.comaLossDb).toBeCloseTo(0, 6);
    expect(s.totalScanLossDb).toBeCloseTo(0, 6);
    expect(s.scannedGainDbi).toBeCloseTo(gain.gainDbi, 6);
    expect(s.skyBeamAngleRad).toBe(0);
  });

  it("sky beam angle equals feed scan times BDF", () => {
    const s = scanPerformance(0.05, 1.5, geom, gain);
    expect(s.skyBeamAngleRad).toBeCloseTo(
      0.05 * beamDeviationFactor(geom.fOverD),
      10,
    );
  });

  it("scan loss grows with scan angle", () => {
    const a = scanPerformance(0.02, 1.5, geom, gain).totalScanLossDb;
    const b = scanPerformance(0.1, 1.5, geom, gain).totalScanLossDb;
    expect(b).toBeGreaterThan(a);
  });
});
