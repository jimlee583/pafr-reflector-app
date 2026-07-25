// Small formatting helpers used across the UI. Pure functions, easy to test.

export function fmtDb(x: number, digits: number = 2): string {
  if (!Number.isFinite(x)) return "\u2014";
  return `${x.toFixed(digits)} dB`;
}

export function fmtDbi(x: number, digits: number = 2): string {
  if (!Number.isFinite(x)) return "\u2014";
  return `${x.toFixed(digits)} dBi`;
}

export function fmtPct(x: number, digits: number = 1): string {
  if (!Number.isFinite(x)) return "\u2014";
  return `${(x * 100).toFixed(digits)}%`;
}

export function fmtDeg(rad: number, digits: number = 2): string {
  if (!Number.isFinite(rad)) return "\u2014";
  return `${((rad * 180) / Math.PI).toFixed(digits)}\u00b0`;
}

export function fmtMeters(m: number, digits: number = 3): string {
  if (!Number.isFinite(m)) return "\u2014";
  if (Math.abs(m) < 0.01) return `${(m * 1000).toFixed(1)} mm`;
  return `${m.toFixed(digits)} m`;
}

export function fmtGHz(hz: number, digits: number = 2): string {
  if (!Number.isFinite(hz)) return "\u2014";
  return `${(hz / 1e9).toFixed(digits)} GHz`;
}

export function fmtNumber(x: number, digits: number = 2): string {
  if (!Number.isFinite(x)) return "\u2014";
  return x.toFixed(digits);
}
