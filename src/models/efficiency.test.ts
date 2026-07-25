import { describe, expect, it } from "vitest";
import {
  blockageEfficiency,
  edgeTaperDb,
  efficiencies,
  illuminationEfficiency,
  spilloverEfficiency,
} from "./efficiency";
import { reflectorGeometry } from "./geometry";
import type { FeedInputs } from "./types";

const feed: FeedInputs = {
  Nx: 8,
  Ny: 8,
  dxLambda: 0.5,
  dyLambda: 0.5,
  elementCosExponentN: 1,
  amplitudeTaper: "uniform",
};

// A broader single-element feed used to exercise the classic textbook
// eta_ap-vs-f/D optimum, which for an 8x8 ESA lives at very large f/D
// (that shift toward shallow dishes is itself the PAFR insight).
const broadFeed: FeedInputs = {
  Nx: 1,
  Ny: 1,
  dxLambda: 0.5,
  dyLambda: 0.5,
  elementCosExponentN: 2,
  amplitudeTaper: "uniform",
};

describe("spilloverEfficiency", () => {
  it("is between 0 and 1", () => {
    const g = reflectorGeometry({ diameterM: 1, fOverD: 0.4 });
    const eta = spilloverEfficiency(feed, g.rimHalfAngleRad);
    expect(eta).toBeGreaterThan(0);
    expect(eta).toBeLessThanOrEqual(1);
  });

  it("increases as the dish subtends more of the feed pattern", () => {
    // shallow dish (large f/D) -> small psi_0 -> less feed power captured
    const shallow = reflectorGeometry({ diameterM: 1, fOverD: 1.0 });
    const deep = reflectorGeometry({ diameterM: 1, fOverD: 0.3 });
    const s = spilloverEfficiency(feed, shallow.rimHalfAngleRad);
    const d = spilloverEfficiency(feed, deep.rimHalfAngleRad);
    expect(d).toBeGreaterThan(s);
  });
});

describe("illuminationEfficiency", () => {
  it("is between 0 and 1", () => {
    const g = reflectorGeometry({ diameterM: 1, fOverD: 0.4 });
    const eta = illuminationEfficiency(feed, g.rimHalfAngleRad);
    expect(eta).toBeGreaterThan(0);
    expect(eta).toBeLessThanOrEqual(1);
  });
});

describe("aperture efficiency spillover/illumination tradeoff", () => {
  // Classic PAFR / reflector-antenna teaching: as f/D grows (dish gets
  // shallower for fixed D), spillover drops but illumination becomes flatter,
  // so combined aperture efficiency has an optimum interior maximum.
  it("has an interior maximum in eta_ap vs f/D", () => {
    const D = 1;
    const A = Math.PI * (D / 2) ** 2;
    const fds = [0.25, 0.35, 0.5, 0.75, 1.25, 2.0];
    const etas = fds.map((fOverD) => {
      const g = reflectorGeometry({ diameterM: D, fOverD });
      return efficiencies(broadFeed, g.rimHalfAngleRad, A, 0).aperture;
    });
    const maxIdx = etas.indexOf(Math.max(...etas));
    // Max should be somewhere in the interior, not at an endpoint.
    expect(maxIdx).toBeGreaterThan(0);
    expect(maxIdx).toBeLessThan(etas.length - 1);
  });
});

describe("blockageEfficiency", () => {
  it("is 1 when there is no blockage", () => {
    expect(blockageEfficiency(10, 0)).toBe(1);
  });

  it("is 0 when the blockage covers the aperture", () => {
    expect(blockageEfficiency(10, 10)).toBe(0);
  });

  it("is monotonic in blockage area", () => {
    expect(blockageEfficiency(10, 1)).toBeGreaterThan(
      blockageEfficiency(10, 2),
    );
  });
});

describe("edgeTaperDb", () => {
  it("is <= 0 dB (rolls off away from boresight)", () => {
    const g = reflectorGeometry({ diameterM: 1, fOverD: 0.4 });
    expect(edgeTaperDb(feed, g.rimHalfAngleRad)).toBeLessThanOrEqual(0);
  });
});
