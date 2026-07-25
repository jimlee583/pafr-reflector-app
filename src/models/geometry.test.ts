import { describe, expect, it } from "vitest";
import { parabolaZ, reflectorGeometry } from "./geometry";

describe("reflectorGeometry", () => {
  it("rim half-angle at f/D = 0.25 is 90 deg (focus at aperture plane)", () => {
    const g = reflectorGeometry({ diameterM: 1, fOverD: 0.25 });
    expect(g.rimHalfAngleRad).toBeCloseTo(Math.PI / 2, 6);
  });

  it("rim half-angle at f/D = 0.5 is atan(1) * 2 = 90 deg? no: 2*atan(0.5)", () => {
    const g = reflectorGeometry({ diameterM: 1, fOverD: 0.5 });
    const expected = 2 * Math.atan(0.5);
    expect(g.rimHalfAngleRad).toBeCloseTo(expected, 10);
    // sanity: ~53.13 deg
    expect((g.rimHalfAngleRad * 180) / Math.PI).toBeCloseTo(53.13, 1);
  });

  it("focal length scales with D and f/D", () => {
    const g = reflectorGeometry({ diameterM: 2, fOverD: 0.4 });
    expect(g.focalLengthM).toBeCloseTo(0.8, 10);
  });

  it("depth = D^2 / (16 F)", () => {
    const D = 1.2;
    const fOverD = 0.4;
    const g = reflectorGeometry({ diameterM: D, fOverD });
    expect(g.depthM).toBeCloseTo((D * D) / (16 * fOverD * D), 10);
  });

  it("focus to rim is 2F / (1 + cos psi_0)", () => {
    const g = reflectorGeometry({ diameterM: 1, fOverD: 0.4 });
    const expected =
      (2 * g.focalLengthM) / (1 + Math.cos(g.rimHalfAngleRad));
    expect(g.focusToRimM).toBeCloseTo(expected, 10);
  });

  it("aperture area is pi * (D/2)^2", () => {
    const g = reflectorGeometry({ diameterM: 3, fOverD: 0.4 });
    expect(g.apertureAreaM2).toBeCloseTo(Math.PI * 1.5 * 1.5, 10);
  });

  it("throws on non-positive inputs", () => {
    expect(() => reflectorGeometry({ diameterM: 0, fOverD: 0.4 })).toThrow();
    expect(() => reflectorGeometry({ diameterM: 1, fOverD: 0 })).toThrow();
  });

  it("parabolaZ matches r^2 / 4F", () => {
    expect(parabolaZ(0.5, 1)).toBeCloseTo(0.25 / 4, 10);
    expect(parabolaZ(0, 1)).toBe(0);
  });
});
