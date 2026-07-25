import { describe, expect, it } from "vitest";
import {
  fmtDb,
  fmtDbi,
  fmtDeg,
  fmtGHz,
  fmtMeters,
  fmtNumber,
  fmtPct,
} from "./format";

describe("format", () => {
  it("formats dB / dBi", () => {
    expect(fmtDb(3.14, 1)).toBe("3.1 dB");
    expect(fmtDbi(42)).toBe("42.00 dBi");
  });

  it("formats percentages", () => {
    expect(fmtPct(0.752, 1)).toBe("75.2%");
  });

  it("converts radians to degrees", () => {
    expect(fmtDeg(Math.PI / 2, 1)).toBe("90.0\u00b0");
  });

  it("switches meters to mm below 1 cm", () => {
    expect(fmtMeters(0.005)).toBe("5.0 mm");
    expect(fmtMeters(1.234)).toBe("1.234 m");
  });

  it("formats GHz", () => {
    expect(fmtGHz(12e9)).toBe("12.00 GHz");
  });

  it("handles non-finite gracefully", () => {
    expect(fmtNumber(NaN)).toBe("\u2014");
    expect(fmtDb(Infinity)).toBe("\u2014");
  });
});
