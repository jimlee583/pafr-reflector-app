// Tiny numerical-integration helpers. Kept dependency-free.

/**
 * Composite Simpson's rule over [a, b] with n subintervals (n even).
 * Falls back to trapezoidal if n is odd.
 */
export function simpson(
  f: (x: number) => number,
  a: number,
  b: number,
  n: number = 200,
): number {
  if (n < 2) n = 2;
  if (n % 2 !== 0) n += 1;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    s += (i % 2 === 0 ? 2 : 4) * f(x);
  }
  return (s * h) / 3;
}
