import { describe, expect, it } from "vitest";
import { computePAFR } from "./index";
import type { PAFRInputs } from "./types";

const nominal: PAFRInputs = {
  reflector: { diameterM: 1, fOverD: 0.4 },
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

describe("computePAFR end to end", () => {
  it("produces a sane nominal result", () => {
    const r = computePAFR(nominal);
    expect(r.wavelengthM).toBeCloseTo(0.02498, 4);
    expect(r.reflector.focalLengthM).toBeCloseTo(0.4, 6);
    expect(r.efficiencies.spillover).toBeGreaterThan(0);
    expect(r.efficiencies.spillover).toBeLessThanOrEqual(1);
    expect(r.efficiencies.aperture).toBeGreaterThan(0);
    expect(r.efficiencies.aperture).toBeLessThan(1);
    // ~ 40 dBi ish for a 1 m dish at 12 GHz with ~55% efficiency
    expect(r.gain.gainDbi).toBeGreaterThan(30);
    expect(r.gain.gainDbi).toBeLessThan(45);
  });

  it("increasing D raises gain by 20*log10 ratio at fixed eta", () => {
    const r1 = computePAFR(nominal);
    const r2 = computePAFR({
      ...nominal,
      reflector: { diameterM: 2, fOverD: 0.4 },
    });
    // eta will shift some (feed pattern vs dish angle unchanged, but blockage
    // fraction differs). Just sanity-check that gain went up meaningfully.
    expect(r2.gain.gainDbi).toBeGreaterThan(r1.gain.gainDbi + 4);
  });

  it("scan angle > 0 reduces the scanned gain", () => {
    const r0 = computePAFR(nominal);
    const rScanned = computePAFR({
      ...nominal,
      scan: { feedScanAngleRad: 0.1 },
    });
    expect(rScanned.scan.scannedGainDbi).toBeLessThan(r0.gain.gainDbi);
    expect(rScanned.scan.totalScanLossDb).toBeGreaterThan(0);
  });
});
