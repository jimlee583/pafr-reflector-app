# Physics notes

Long-form derivations and intuition behind the KPIs shown in the PAFR
Reflector Illumination App. Each section is meant to be readable on its
own; the app's UI captions are the short version, this file is where to
come when the short version raises more questions than it answers.

Everything here is **first-order / textbook-level**. Where a formula is
heuristic or a small-perturbation expansion that eventually breaks, the
section flags it. See [Caveats](#caveats--where-these-first-order-models-break)
at the end.

## Conventions & symbols

| Symbol | Meaning | Units |
|--------|---------|-------|
| \(D\) | Reflector diameter | m |
| \(F\) | Reflector focal length | m |
| \(f/D\) | Focal-length-to-diameter ratio | — |
| \(\psi\) | Angle measured from the focus, off the reflector axis | rad |
| \(\psi_0\) | Rim half-angle: \(\psi\) at the reflector rim | rad |
| \(\theta\) | Angle measured from the ESA feed's own boresight | rad |
| \(\theta_{\text{scan}}\) | Electronic scan angle of the ESA feed | rad |
| \(\theta_{\text{sky}}\) | Sky-side beam angle produced by the reflector | rad |
| \(\theta_{\text{HPBW}}\) | Half-power beamwidth of the composite antenna | rad |
| \(\lambda\) | Free-space wavelength | m |
| \(N_x, N_y, d_x, d_y\) | ESA element counts and pitches | —, \(\lambda\) |
| \(n\) | ESA element cos-pattern exponent, \(E_{\text{el}} = \cos^{n}\theta\) | — |
| \(\eta_s, \eta_i, \eta_b, \eta_{\text{ap}}\) | Spillover, illumination, blockage, aperture efficiency | — |
| \(G\) | Peak antenna gain | linear or dBi |

Coordinate convention: dish vertex at the origin, dish axis along \(+z\)
(pointing at the sky), aperture radius \(r\) measured in the \(x\)–\(y\)
plane, feed at \((z, r) = (F, 0)\).

## 1. Reflector geometry

TBD — rim half-angle \(\psi_0 = 2\arctan\bigl(1/(4\,f/D)\bigr)\), depth
\(D^2/(16F)\), focus-to-rim distance from the polar equation
\(\rho(\psi) = 2F/(1 + \cos\psi)\), and where each of those shows up in
[`src/models/geometry.ts`](../src/models/geometry.ts).

## 2. Feed model

TBD — element voltage pattern \(\cos^{n}\theta\), rectangular-array
factor as a product of 1-D sincs, \(\phi\)-averaged intensity used for
the axisymmetric reflector integrals. Reference:
[`src/models/feed.ts`](../src/models/feed.ts).

## 3. Spillover vs illumination trade

TBD — Silver's classic formulas

\[
  \eta_s = \frac{\int_{0}^{\psi_0} P(\psi)\,\sin\psi\,d\psi}{\int_{0}^{\pi} P(\psi)\,\sin\psi\,d\psi},
  \qquad
  \eta_i = \frac{2\cot^2(\psi_0/2)\,\bigl|\int_0^{\psi_0}\sqrt{P(\psi)}\,\tan(\psi/2)\,d\psi\bigr|^2}{\int_0^{\psi_0} P(\psi)\,\sin\psi\,d\psi}
\]

why their product has an interior optimum in \(f/D\), and why narrower
feeds (bigger ESAs) shift that optimum toward shallower dishes.
Reference: [`src/models/efficiency.ts`](../src/models/efficiency.ts).

## 4. Blockage

TBD — where the \(\eta_b = (1 - A_{\text{block}}/A_{\text{dish}})^2\)
form comes from, when it under- or over-estimates the true impact
(scattered-power vs simple aperture-area picture), and why offset
optics is the standard fix. Reference:
[`src/models/efficiency.ts`](../src/models/efficiency.ts).

## 5. Beam Deviation Factor

TBD — physical origin (feed offset produces beam tilt but not the full
geometric angle), the empirical
\((1 + 0.36 q^2)/(1 + q^2)\) form with \(q = 1/(4\,f/D)\), and why
BDF approaches 1 for shallow dishes and drops for deep ones.
Reference: [`src/models/scan.ts`](../src/models/scan.ts).

## 6. Scan loss: element rolloff + coma

Electronically scanning the ESA feed off boresight costs gain through
two mechanisms, both modeled in
[`src/models/scan.ts`](../src/models/scan.ts).

### Element pattern rolloff

Each ESA element radiates with a voltage pattern \(\cos^{n}\theta\), so
its power pattern is \(\cos^{2n}\theta\). When the array is
electronically scanned to \(\theta_{\text{scan}}\), the whole array's
peak sits on that element pattern, so the composite feed loses

\[
  L_{\text{el}}(\text{dB}) = -10\log_{10}\bigl(\cos^{2n}\theta_{\text{scan}}\bigr).
\]

This is the "element loss" curve in the scan-vs-angle trade plot. It's
sharp and depends only on the assumed element type (\(n\)), independent
of the reflector.

### Coma / defocus loss

This is the subtler one. It grows **quadratically with scanned
beamwidths** — here's why.

**Step 1: scanning the beam is optically equivalent to displacing the feed.**
Electronically scanning the ESA by \(\theta_{\text{scan}}\) tilts its
outgoing plane wave; when that tilted wave lands on the reflector, the
reflector sees it exactly as it would see a point feed moved sideways
off the focal point by

\[
  \delta \;\approx\; F\,\tan\theta_{\text{scan}} \;\approx\; F\,\theta_{\text{scan}}.
\]

**Step 2: the offset feed puts a cubic phase error on the aperture.**
A paraboloid is defined so that rays from a point source *at the focus*
all reach the aperture plane with the same phase — that's what "focus"
means. Once the source is displaced by \(\delta\), the path length from
source to each aperture point picks up correction terms. Expanded in
aperture radius \(r\) and azimuth \(\phi\):

\[
  \Delta(r,\phi) \;=\; \underbrace{\tfrac{\delta\,r}{F}\cos\phi}_{\text{linear (beam tilt)}}
  \;-\; \underbrace{\tfrac{\delta\,r^3}{4F^3}\cos\phi}_{\text{cubic (coma)}}
  \;+\;\cdots
\]

- The **linear term** is a phase ramp across the aperture — that just
  re-points the beam. It is what the Beam Deviation Factor bookkeeps;
  it is not a loss.
- The **cubic term** is asymmetric in \(\phi\) (it flips sign across
  the aperture). That asymmetric phase error deforms the beam and
  bleeds power into a "coma lobe" on one side. That's where the loss
  comes from.

Crucially, the peak cubic phase error is proportional to \(\delta\),
which is proportional to \(\theta_{\text{scan}}\):

\[
  \Delta_{\text{coma, peak}} \;\propto\; \delta \;\propto\; \theta_{\text{scan}}.
\]

**Step 3: Ruze — gain loss is quadratic in RMS phase error.**
For a small phase error \(\sigma_\varphi\) (radians) across the
aperture, the Ruze approximation for on-boresight gain is

\[
  \frac{G}{G_0} \;\approx\; e^{-\sigma_\varphi^{2}} \;\approx\; 1 - \sigma_\varphi^{2},
\]

so loss (as a fraction, or in dB) is quadratic in the phase error:

\[
  L \;\propto\; \sigma_\varphi^{2}.
\]

**Step 4: put it together.** Coma phase error is linear in
\(\theta_{\text{scan}}\); loss is quadratic in phase error; therefore
loss is quadratic in scan angle. Beamwidth
\(\theta_{\text{HPBW}} \approx 1.02\,\lambda/D\) is a fixed constant of
the geometry, so equivalently

\[
  L_{\text{coma}}(\text{dB}) \;\propto\; \left(\tfrac{\theta_{\text{scan}}}{\theta_{\text{HPBW}}}\right)^{2}.
\]

That's the "quadratic in beamwidths scanned" statement.

**Step 5: why deeper dishes coma faster.** The cubic term's coefficient
scales as \(\delta / F^3 = \theta_{\text{scan}} / F^2\). For fixed \(D\),
\(F^2 \propto (f/D)^2\), so the coma phase error itself picks up an
extra factor of \(1/(f/D)^2\), and since loss is quadratic in that, the
whole **coma-loss coefficient scales like** \(1/(f/D)^{2}\). That is
exactly the shape used in the app:

```25:30:src/models/scan.ts
export function comaCoefficient(fOverD: number): number {
  const q = 1 / (4 * fOverD);
  return 0.05 + 0.15 * q * q;
}
```

with \(q = 1/(4\,f/D) = D/(4F)\), so \(q^2\) is the \(1/(f/D)^2\)
factor. The loss itself is then just coefficient times beamwidths
squared:

```47:48:src/models/scan.ts
  const beamwidths = gain.hpbwRad > 0 ? skyBeamAngleRad / gain.hpbwRad : 0;
  const comaLossDb = comaCoefficient(reflector.fOverD) * beamwidths * beamwidths;
```

### One honest caveat

Ruze's expansion is a **small-perturbation** result. At larger scans
the cubic aperture phase is no longer small, the beam grows a real
coma lobe on the shoulder, the peak gain drop stops behaving purely
quadratically, and eventually the whole "displaced point source"
picture breaks down because an ESA is not a point source. The app's
quadratic model is honest for maybe the first few beamwidths of scan
and progressively optimistic beyond that. Anything past a handful of
beamwidths of scan wants a physical-optics reflector solver, not this
app.

## 7. Grating lobes

TBD — the \(\sin\theta_g = \sin\theta_{\text{scan}} - m\lambda/d\)
condition, the "unconstrained if \(d \le \lambda/2\)" special case,
and how the max-scan check in
[`src/models/grating.ts`](../src/models/grating.ts) drops out of it.

## Caveats & where these first-order models break

- **Physical optics.** Every efficiency here is a scalar integral over
  an assumed feed pattern. Real reflector behavior includes edge
  diffraction, cross-polarization, and near-field effects that a full
  physical-optics (PO) or method-of-moments (MoM) solver captures
  and this app does not.
- **Feed idealizations.** The ESA is modeled as an ideal uniform array
  of \(\cos^{n}\theta\) elements with no mutual coupling, no scan
  blindness, and no active-impedance variation. Real arrays deviate
  meaningfully from this at wide scan.
- **Coma model.** As noted above, the coma term is a Ruze-style
  small-perturbation quadratic. It is progressively optimistic beyond
  a few HPBWs of scan.
- **Blockage model.** \(\eta_b = (1 - A_b/A_d)^2\) treats blockage as a
  simple aperture-area loss; the real story includes scattered-power
  interference patterns that can push the number either way.
- **BDF form.** The \((1 + 0.36 q^2)/(1 + q^2)\) approximation is a
  widely-used empirical fit, not an exact result — it assumes a
  particular feed illumination.
- **Surface error, pointing error, RF losses, ohmic losses.** All
  ignored. Real \(G\) is \(\eta_{\text{ap}}\) times more penalties
  than this app tracks.

If you need numbers you can defend in a review, use this app to build
intuition and to pick a starting design point, then hand that design
to a real reflector solver.
