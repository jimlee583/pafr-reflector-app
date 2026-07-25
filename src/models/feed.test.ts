import { describe, expect, it } from "vitest";
import {
  arrayFactor1D,
  elementVoltage,
  feedIntensity,
  feedIntensityAxi,
  feedPeakDirectivity,
} from "./feed";
import type { FeedInputs } from "./types";

const smallArray: FeedInputs = {
  Nx: 4,
  Ny: 4,
  dxLambda: 0.5,
  dyLambda: 0.5,
  elementCosExponentN: 1,
  amplitudeTaper: "uniform",
};

describe("elementVoltage", () => {
  it("is 1 on boresight for any n", () => {
    expect(elementVoltage(0, 1)).toBeCloseTo(1);
    expect(elementVoltage(0, 3)).toBeCloseTo(1);
  });

  it("is 0 at and beyond 90 deg", () => {
    expect(elementVoltage(Math.PI / 2, 1)).toBe(0);
    expect(elementVoltage(2, 1)).toBe(0);
  });
});

describe("arrayFactor1D", () => {
  it("peaks at u = 0", () => {
    expect(arrayFactor1D(0, 8, 0.5)).toBeCloseTo(1, 8);
  });

  it("hits a null at the first sinc zero for uniform array", () => {
    // First null at u = 1/(N*d) for a uniform N-element array of pitch d.
    const N = 8;
    const d = 0.5;
    const uNull = 1 / (N * d);
    expect(Math.abs(arrayFactor1D(uNull, N, d))).toBeLessThan(1e-8);
  });
});

describe("feedIntensity", () => {
  it("is 1 at boresight", () => {
    expect(feedIntensity(0, 0, smallArray)).toBeCloseTo(1, 8);
  });

  it("is 0 behind the ground plane", () => {
    expect(feedIntensity(Math.PI / 2, 0, smallArray)).toBe(0);
  });
});

describe("feedIntensityAxi", () => {
  it("matches feedIntensity(0, ...) at boresight", () => {
    expect(feedIntensityAxi(0, smallArray)).toBeCloseTo(1, 8);
  });
});

describe("feedPeakDirectivity", () => {
  it("increases with array size", () => {
    const small: FeedInputs = { ...smallArray, Nx: 4, Ny: 4 };
    const big: FeedInputs = { ...smallArray, Nx: 16, Ny: 16 };
    expect(feedPeakDirectivity(big)).toBeGreaterThan(
      feedPeakDirectivity(small),
    );
  });

  it("is well above 1 for a modest array", () => {
    const d = feedPeakDirectivity(smallArray);
    // 4x4 at 0.5-lambda with cos element: aperture ~= 4 lambda^2,
    // so D ~ 4*pi*A/lambda^2 * eff ~ 50. Rough sanity.
    expect(d).toBeGreaterThan(10);
    expect(d).toBeLessThan(500);
  });
});
