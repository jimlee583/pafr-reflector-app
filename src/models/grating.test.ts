import { describe, expect, it } from "vitest";
import { gratingCheck } from "./grating";
import type { FeedInputs } from "./types";

const base: FeedInputs = {
  Nx: 8,
  Ny: 8,
  dxLambda: 0.5,
  dyLambda: 0.5,
  elementCosExponentN: 1,
  amplitudeTaper: "uniform",
};

describe("gratingCheck", () => {
  it("is unconstrained at 0.5-lambda spacing", () => {
    const g = gratingCheck(base, 0);
    expect(g.maxScanBeforeGratingRad).toBeCloseTo(Math.PI / 2, 6);
    expect(g.currentScanSafe).toBe(true);
  });

  it("shrinks max scan as pitch grows", () => {
    const wide = { ...base, dxLambda: 0.9, dyLambda: 0.9 };
    const g = gratingCheck(wide, 0);
    expect(g.maxScanBeforeGratingRad).toBeLessThan(Math.PI / 2);
    // 0.9-lambda spacing: sin(theta) = 1/0.9 - 1 = 0.111, so ~6.4 deg
    expect((g.maxScanBeforeGratingRad * 180) / Math.PI).toBeCloseTo(6.38, 1);
  });

  it("flags unsafe scan beyond the limit", () => {
    const wide = { ...base, dxLambda: 0.9, dyLambda: 0.9 };
    const overScan = 20 * (Math.PI / 180);
    const g = gratingCheck(wide, overScan);
    expect(g.currentScanSafe).toBe(false);
  });
});
