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
| $D$ | Reflector diameter | m |
| $F$ | Reflector focal length | m |
| $f/D$ | Focal-length-to-diameter ratio | — |
| $\psi$ | Angle measured from the focus, off the reflector axis | rad |
| $\psi_0$ | Rim half-angle: $\psi$ at the reflector rim | rad |
| $\theta$ | Angle measured from the ESA feed's own boresight | rad |
| $\theta_{\text{scan}}$ | Electronic scan angle of the ESA feed | rad |
| $\theta_{\text{sky}}$ | Sky-side beam angle produced by the reflector | rad |
| $\theta_{\text{HPBW}}$ | Half-power beamwidth of the composite antenna | rad |
| $\lambda$ | Free-space wavelength | m |
| $N_x, N_y, d_x, d_y$ | ESA element counts and pitches | —, $\lambda$ |
| $n$ | ESA element cos-pattern exponent, $E_{\text{el}} = \cos^{n}\theta$ | — |
| $\eta_s, \eta_i, \eta_b, \eta_{\text{ap}}$ | Spillover, illumination, blockage, aperture efficiency | — |
| $G$ | Peak antenna gain | linear or dBi |

Coordinate convention: dish vertex at the origin, dish axis along $+z$
(pointing at the sky), aperture radius $r$ measured in the $x$–$y$
plane, feed at $(z, r) = (F, 0)$.

## 1. Reflector geometry

Everything downstream — spillover, illumination, blockage area,
coma, BDF — is keyed off two numbers: the dish diameter $D$ and the
ratio $f/D$. From those the app builds the rest of the prime-focus
paraboloid in
[`src/models/geometry.ts`](../src/models/geometry.ts). This section
derives the three quantities that keep showing up later: the rim
half-angle $\psi_0$, the dish depth, and the focus-to-rim path length.

### Inputs and the Cartesian parabola

The only free geometry inputs are $D$ and $f/D$. Focal length is
immediate:

$$
F \;=\; (f/D)\,D.
$$

With the vertex at the origin and the axis along $+z$ (skyward), the
surface is the familiar Cartesian parabola

$$
z(r) \;=\; \frac{r^{2}}{4F},
\qquad |r| \le D/2.
$$

That is `parabolaZ` — used to draw the side-view dish curve in the
geometry panel:

```37:39:src/models/geometry.ts
export function parabolaZ(rM: number, focalLengthM: number): number {
  return (rM * rM) / (4 * focalLengthM);
}
```

The feed sits at the focus $(z, r) = (F, 0)$.

### Depth

Evaluate $z$ at the rim $r = D/2$:

$$
\text{depth} \;=\; z(D/2) \;=\; \frac{(D/2)^{2}}{4F} \;=\; \frac{D^{2}}{16F}.
$$

This is the axial distance from vertex to aperture plane, reported on
the "Reflector focal length" KPI card as `depth = …`. Deeper dishes
(small $f/D$) have larger depth; in the limit $f/D = 0.25$ the focus
sits exactly in the aperture plane and depth $= F = D/4$.

### Rim half-angle $\psi_0$

$\psi$ is the angle at the **focus**, measured off the reflector axis,
to a point on the dish. A standard parabola identity relates $\psi$ to
aperture radius:

$$
\tan\!\bigl(\tfrac{\psi}{2}\bigr) \;=\; \frac{r}{2F}
\qquad\Leftrightarrow\qquad
\psi(r) \;=\; 2\arctan\!\bigl(\tfrac{r}{2F}\bigr).
$$

(The same map appears under the hood of the aperture-illumination plot
in §3.) At the rim $r = D/2$:

$$
\tan\!\bigl(\tfrac{\psi_0}{2}\bigr)
\;=\; \frac{D}{4F}
\;=\; \frac{1}{4\,f/D},
$$

so

$$
\psi_0 \;=\; 2\arctan\!\bigl(\tfrac{1}{4\,f/D}\bigr).
$$

```17:20:src/models/geometry.ts
  const F = fOverD * D;
  const psi0 = 2 * Math.atan(1 / (4 * fOverD));
  const depth = (D * D) / (16 * F);
  const focusToRim = (2 * F) / (1 + Math.cos(psi0));
```

Useful landmarks:

| $f/D$ | $\psi_0$ | shape |
|-------|----------|-------|
| $0.25$ | $90^\circ$ | focus in the aperture plane; dish sees the whole forward hemisphere |
| $0.4$ | $\sim 64^\circ$ | typical prime-focus operating point |
| $0.5$ | $\sim 53^\circ$ | unit-test sanity check (`2\arctan(0.5)`) |
| large | $\to 0$ | shallow dish; focus far behind a nearly flat aperture |

$\psi_0$ is the upper limit on every Silver integral in §3
(`spilloverEfficiency`, `illuminationEfficiency`, `edgeTaperDb`), and
it is the angle drawn as the arc at the focus in the geometry side
view. Note also that the BDF / coma parameter of §§5–6,

$$
q \;=\; \frac{1}{4\,f/D} \;=\; \tan\!\bigl(\tfrac{\psi_0}{2}\bigr),
$$

is exactly this same geometric quantity — deep vs shallow is one knob
shared across the whole file.

### Polar equation and focus-to-rim distance

Measured from the focus, the distance to a surface point at angle
$\psi$ is the polar form of the same parabola:

$$
\rho(\psi) \;=\; \frac{2F}{1 + \cos\psi}.
$$

Checks: $\rho(0) = F$ (focus to vertex), and at the rim

$$
\rho(\psi_0) \;=\; \frac{2F}{1 + \cos\psi_0}
\;=\; \texttt{focusToRimM}.
$$

The $1/\rho^{2}$ intensity falloff between focus and dish is the
**space-loss** factor in the aperture illumination and edge-taper
KPIs (§3). Because $\rho(\psi)/\rho(0) = 1/\cos^{2}(\psi/2)$, the
rim is always farther from the feed than the vertex is, and deeper
dishes (larger $\psi_0$) take a bigger space-loss hit at the edge on
top of whatever the feed pattern $P(\psi_0)$ already gives.

### Aperture area

The projected aperture (not the curved surface area) is just

$$
A_{\text{dish}} \;=\; \pi\bigl(D/2\bigr)^{2}.
$$

That is the denominator of the blockage fraction in §4 and the
physical area that sets peak directivity once the efficiencies are
folded in.

### Where each quantity lands in the app

| Quantity | Formula | Consumers |
|----------|---------|-----------|
| $F$ | $(f/D)\,D$ | side-view drawing, $\psi(r)$, scan / coma models |
| $\psi_0$ | $2\arctan(1/(4\,f/D))$ | spillover, illumination, edge taper; geometry arc |
| depth | $D^{2}/(16F)$ | KPI detail; aperture-plane drawing |
| $\rho(\psi_0)$ | $2F/(1+\cos\psi_0)$ | space-loss / edge taper |
| $A_{\text{dish}}$ | $\pi(D/2)^{2}$ | blockage $\eta_b$, gain |

```12:31:src/models/geometry.ts
export function reflectorGeometry(inputs: ReflectorInputs): ReflectorGeometry {
  const { diameterM: D, fOverD } = inputs;
  // ...
  const F = fOverD * D;
  const psi0 = 2 * Math.atan(1 / (4 * fOverD));
  const depth = (D * D) / (16 * F);
  const focusToRim = (2 * F) / (1 + Math.cos(psi0));
  const aperture = Math.PI * (D / 2) * (D / 2);
  return {
    fOverD, diameterM: D, focalLengthM: F,
    rimHalfAngleRad: psi0, depthM: depth,
    focusToRimM: focusToRim, apertureAreaM2: aperture,
  };
}
```

No caveat beyond the obvious: this is ideal geometric optics on a
perfect paraboloid of revolution. Surface RMS error, strut shadows,
and feed-support scattering are all deferred to the
[Caveats](#caveats--where-these-first-order-models-break).

## 2. Feed model

The reflector is illuminated by a rectangular ESA sitting at the focus.
The feed model in [`src/models/feed.ts`](../src/models/feed.ts) builds
that pattern in three layers — element, array factor, then a
$\phi$-average that turns the rectangular grid into something the
axisymmetric dish integrals of §3 can digest. Peak is normalized to 1
at boresight; absolute scale cancels in every efficiency ratio
downstream.

### Element pattern: $\cos^{n}\theta$

Each element has a voltage pattern

$$
E_{\text{el}}(\theta) \;=\; \cos^{n}\theta,
\qquad \theta < \pi/2,
$$

and is identically zero at and beyond $\theta = \pi/2$ (no
back-hemisphere radiation — the element sits on a ground plane). Power
goes as $\cos^{2n}\theta$. The exponent $n$ is a user knob:

| $n$ | Rough element type |
|-----|--------------------|
| $1$ | Huygens-like / short dipole over ground |
| $1.5$–$2$ | Patch on a ground plane (the app default is $1.5$) |

```19:25:src/models/feed.ts
export function elementVoltage(thetaRad: number, n: number): number {
  const c = Math.cos(thetaRad);
  // Snap tiny cosines (e.g., Math.cos(pi/2) ~ 6e-17) to zero so the pattern
  // is truly zero at and beyond 90 deg regardless of the exponent.
  if (c <= 1e-12) return 0;
  return Math.pow(c, n);
}
```

Two places this shows up again: (i) spillover's total-power integral
stops at $\pi/2$ rather than $\pi$ because there is nothing to
integrate past the horizon (§3); (ii) electronic scan pays an element
rolloff of $-10\log_{10}(\cos^{2n}\theta_{\text{scan}})$ dB (§6).

### Array factor: product of 1-D sincs

A uniform $N$-element line array of pitch $d$ (in wavelengths) has the
classic normalized array factor

$$
\mathrm{AF}_{1\mathrm{D}}(u)
\;=\;
\left|
\frac{\sin(N\pi\,d\,u)}{N\sin(\pi\,d\,u)}
\right|,
\qquad
\mathrm{AF}_{1\mathrm{D}}(0) = 1.
$$

Here $u$ is the direction cosine along the array axis
($u = \sin\theta\cos\phi$ or $\sin\theta\sin\phi$). The rectangular
grid is separable, so the 2-D factor is just the product

$$
\mathrm{AF}(\theta,\phi)
\;=\;
\mathrm{AF}_{1\mathrm{D}}(u_x;\,N_x,d_x)\,
\mathrm{AF}_{1\mathrm{D}}(u_y;\,N_y,d_y).
$$

```34:40:src/models/feed.ts
export function arrayFactor1D(u: number, N: number, dLambda: number): number {
  const x = Math.PI * dLambda * u;
  const denom = N * Math.sin(x);
  const num = Math.sin(N * x);
  if (Math.abs(denom) < 1e-12) return 1; // limit as x -> 0 (or grating-lobe peaks)
  return num / denom;
}
```

The same zeros that set the first sidelobe nulls
($u = 1/(N d)$ for a uniform array) are also the grating-lobe peaks
when $d$ is large — that singularity is what §7 turns into a max-scan
gate. Amplitude taper is currently locked to `"uniform"` (an extension
point in the type); a non-uniform taper would replace the sinc with a
weighted Dirichlet kernel but would not change the rest of the
pipeline.

### Full intensity

Putting the layers together:

$$
\bigl|F(\theta,\phi)\bigr|^{2}
\;=\;
\bigl|E_{\text{el}}(\theta)\bigr|^{2}\,
\bigl|\mathrm{AF}(\theta,\phi)\bigr|^{2},
$$

normalized so the boresight value is 1:

```46:59:src/models/feed.ts
export function feedIntensity(
  thetaRad: number,
  phiRad: number,
  feed: FeedInputs,
): number {
  const ev = elementVoltage(thetaRad, feed.elementCosExponentN);
  if (ev === 0) return 0;
  const s = Math.sin(thetaRad);
  const ux = s * Math.cos(phiRad);
  const uy = s * Math.sin(phiRad);
  const afx = arrayFactor1D(ux, feed.Nx, feed.dxLambda);
  const afy = arrayFactor1D(uy, feed.Ny, feed.dyLambda);
  const af = afx * afy;
  return ev * ev * af * af;
}
```

Bigger $N$ or larger $d$ (within the grating-lobe limit) narrows the
main lobe: that is the lever §3 uses when it says "narrower feeds
shift the $f/D$ optimum shallower."

### $\phi$-averaged intensity $P(\psi)$

The dish rim is a circle of half-angle $\psi_0$. Silver's spillover and
illumination integrals are therefore 1-D in $\psi$, which requires an
axisymmetric feed intensity. A rectangular ESA is not axisymmetric, so
the app $\phi$-averages:

$$
P(\theta)
\;=\;
\bigl\langle \bigl|F(\theta,\phi)\bigr|^{2} \bigr\rangle_{\phi}.
$$

Because a rectangular grid has 90° symmetry it is enough to average
over $\phi \in [0,\pi/2]$:

```66:79:src/models/feed.ts
export function feedIntensityAxi(
  thetaRad: number,
  feed: FeedInputs,
  nPhi: number = 32,
): number {
  // For a rectangular grid the pattern has 90-degree symmetry, so we only
  // need to average over phi in [0, pi/2] and it matches the full azimuth
  // average. Trapezoidal midpoint average is fine here.
  let sum = 0;
  for (let i = 0; i < nPhi; i++) {
    const phi = ((i + 0.5) / nPhi) * (Math.PI / 2);
    sum += feedIntensity(thetaRad, phi, feed);
  }
  return sum / nPhi;
}
```

For a centered, unscanned feed at the focus, the feed angle $\theta$
coincides with the reflector angle $\psi$, so $P(\psi)$ is exactly
what §3 integrates. Peak remains 1 at $\psi = 0$.

### Peak feed directivity and physical size

Two bookkeeping outputs come along for free. Peak feed directivity
from the usual definition, reduced to a $\phi$-averaged integral over
the forward hemisphere:

$$
D_f
\;=\;
\frac{4\pi\,P_{\max}}
     {\displaystyle\int |F|^{2}\,d\Omega}
\;=\;
\frac{4\pi}
     {2\pi\displaystyle\int_{0}^{\pi/2} P(\theta)\,\sin\theta\,d\theta},
$$

since $P_{\max} = 1$. That is the "Feed directivity" KPI. Physical
array size is just pitch times count times wavelength,

$$
A_{\text{block}}
\;=\;
(N_x\,d_x\,\lambda)\,(N_y\,d_y\,\lambda),
$$

which becomes the blockage area of §4. Both are assembled in
`feedGeometry`.

### One honest caveat

This is an **ideal uniform array of identical $\cos^{n}\theta$
elements**: no mutual coupling, no active-impedance variation with
scan, no feed-housing pattern, no amplitude taper beyond uniform, and
a $\phi$-average that erases the principal-plane vs diagonal asymmetry
of a real rectangular grid. Those idealizations are fine for the
trades this app targets — size the array, pick $f/D$, budget spillover
vs blockage — and they match the classical Silver / Balanis
feed-pattern assumptions. Once you care about scan blindness,
cross-pol, or the few-percent azimuthal asymmetry in aperture taper,
you want a full-wave array model feeding a PO reflector solver. See
[Caveats](#caveats--where-these-first-order-models-break) and the
matching caveat at the end of §3.

## 3. Spillover vs illumination trade

The reflector sees the feed through a circular rim of half-angle
$\psi_0$, and the two big efficiencies that come out of that geometry
— spillover $\eta_s$ and illumination (taper) $\eta_i$ — pull in
opposite directions as $\psi_0$ changes. Their product $\eta_s\,\eta_i$
is the optical aperture efficiency (before blockage), and it has an
interior optimum in $f/D$. This section is the story behind the
"Efficiency vs f/D" trade plot and the spillover / illumination /
aperture-efficiency KPIs.

### The feed intensity $P(\psi)$

Everything below is written in terms of the $\phi$-averaged feed
intensity

$$
P(\psi) \;=\; \bigl\langle |F(\theta = \psi,\,\phi)|^2 \bigr\rangle_{\phi},
$$

which is `feedIntensityAxi(psi, feed)` in
[`src/models/feed.ts`](../src/models/feed.ts). We identify $\theta$
(the feed's own angle from its boresight) with $\psi$ (the angle from
the focus, off the reflector axis) because for a centered, unscanned
feed sitting at the focus the two axes coincide. Peak is at
$\psi = 0$; the normalization of $P$ cancels in every ratio below.

### Spillover $\eta_s$: how much of the feed lands on the dish

Silver's classic form:

$$
\eta_s \;=\;
\frac{\int_{0}^{\psi_0} P(\psi)\,\sin\psi\,d\psi}
     {\int_{0}^{\pi/2} P(\psi)\,\sin\psi\,d\psi}.
$$

Numerator is the feed power the dish subtends
($0 \le \psi \le \psi_0$); denominator is the total feed power. The
upper limit on the total is $\pi/2$, not $\pi$: the element voltage
pattern is $\cos^{n}\theta$ and snaps to zero at $\theta \ge \pi/2$,
so there is no back-hemisphere power to count.

```26:44:src/models/efficiency.ts
export function spilloverEfficiency(
  feed: FeedInputs,
  rimHalfAngleRad: number,
): number {
  const captured = simpson(
    (psi) => feedIntensityAxi(psi, feed) * Math.sin(psi),
    EPS,
    rimHalfAngleRad,
    200,
  );
  const total = simpson(
    (psi) => feedIntensityAxi(psi, feed) * Math.sin(psi),
    EPS,
    Math.PI / 2, // element pattern kills the back hemisphere
    200,
  );
  if (total <= 0) return 0;
  return clamp01(captured / total);
}
```

Deeper dishes have larger $\psi_0$ (bigger rim, seen from the focus),
so they capture more of $P(\psi)$ and $\eta_s$ climbs. In the limit
$\psi_0 \to \pi/2$ ($f/D = 0.25$, focus sitting in the aperture
plane), the dish sees the entire forward hemisphere and
$\eta_s \to 1$.

### Illumination $\eta_i$: how uniformly it lands

$$
\eta_i \;=\;
\frac{2\cot^2(\psi_0/2)\,
      \bigl|\int_0^{\psi_0}\sqrt{P(\psi)}\,\tan(\psi/2)\,d\psi\bigr|^2}
     {\int_0^{\psi_0} P(\psi)\,\sin\psi\,d\psi}.
$$

This is the aperture-plane taper efficiency: it compares the actual
tapered aperture field to a uniformly-illuminated one of the same
total power. It is $\le 1$, with equality only for a perfectly flat
aperture. The $\sqrt{P}$ in the numerator is a voltage (not power)
integral, because taper efficiency cares about the coherent field
sum across the aperture; the $\tan(\psi/2)$ and $\cot^2(\psi_0/2)$
weights come from mapping the feed's solid-angle element
$\sin\psi\,d\psi$ onto an equal-area aperture element (see §1 /
`parabolaZ`).

```46:66:src/models/efficiency.ts
export function illuminationEfficiency(
  feed: FeedInputs,
  rimHalfAngleRad: number,
): number {
  const num = simpson(
    (psi) => Math.sqrt(feedIntensityAxi(psi, feed)) * Math.tan(psi / 2),
    EPS,
    rimHalfAngleRad,
    200,
  );
  const den = simpson(
    (psi) => feedIntensityAxi(psi, feed) * Math.sin(psi),
    EPS,
    rimHalfAngleRad,
    200,
  );
  if (den <= 0) return 0;
  const cot = 1 / Math.tan(rimHalfAngleRad / 2);
  const eta = 2 * cot * cot * (num * num) / den;
  return clamp01(eta);
}
```

Deep dishes ($\psi_0$ large) sample $P(\psi)$ out into its shoulders
where it has fallen off substantially — the rim is dark, the taper
is steep, $\eta_i$ drops. Shallow dishes ($\psi_0$ small) only touch
the near-peak part of $P$, so the aperture is close to uniformly
lit and $\eta_i \to 1$.

### The aperture illumination plot

Under the hood of the "Aperture illumination (radial cut)" plot is
the mapping from focus angle $\psi$ to aperture radius $r$ and the
$1/\rho^2$ space-loss factor from focus to reflector:

$$
\psi(r) \;=\; 2\arctan\!\bigl(r / (2F)\bigr),
\qquad
\bigl|E_{\text{ap}}(r)\bigr|^2 \;\propto\;
P(\psi) \cdot \left(\tfrac{1 + \cos\psi}{2}\right)^{2}.
$$

The $((1+\cos\psi)/2)^2$ factor comes from
$\rho(\psi) = 2F/(1 + \cos\psi)$: energy falls off as $1/\rho^2$
between focus and dish, and $(1+\cos\psi)/2$ is exactly
$\rho_{\text{vertex}}/\rho(\psi)$. Deeper dishes have longer edge
paths and thus a bigger space-loss dip at the rim on top of whatever
$P(\psi_0)$ already gives.

The scalar "edge taper" KPI is this same expression evaluated at
$\psi = \psi_0$ and reported in dB relative to the on-axis value:

```97:113:src/models/efficiency.ts
export function edgeTaperDb(
  feed: FeedInputs,
  rimHalfAngleRad: number,
): number {
  const p = feedIntensityAxi(rimHalfAngleRad, feed);
  if (p <= 0) return -60;
  // Feed pattern in dB relative to peak
  const patternDb = 10 * Math.log10(p);
  // Space-loss factor from focus to rim vs focus to vertex:
  // rho_rim / rho_vertex = 1 / cos^2(psi/2) ... but we express as dB penalty
  // Space loss in intensity is 1/rho^2. rho(psi)/rho(0) = 1 / cos^2(psi/2)
  // (since rho(0) = F and rho(psi) = 2F/(1+cos(psi)) = F/cos^2(psi/2)).
  const rhoRatio = 1 / Math.pow(Math.cos(rimHalfAngleRad / 2), 2);
  const spaceLossDb = -20 * Math.log10(rhoRatio);
  return patternDb + spaceLossDb;
}
```

$\eta_i$ is the integrated version of the same picture; edge taper
is the pointwise summary at the worst point ($r = D/2$).

### Why the product has an interior optimum in $f/D$

Combine the two trends:

| $f/D$ | $\psi_0$ | $\eta_s$ | $\eta_i$ | $\eta_s\,\eta_i$ |
|-------|----------|----------|----------|------------------|
| small (deep) | large | high — dish subtends most of $P$ | low — rim is dark, aperture heavily tapered | pulled down by $\eta_i$ |
| large (shallow) | small | low — most of $P$ misses the rim | high — the sliver we see is near-peak | pulled down by $\eta_s$ |

Neither extreme wins; the product peaks somewhere in the middle,
typically $f/D \sim 0.3$–$0.5$ for the feed patterns this app
supports. This is the interior optimum you see in "Efficiency vs
f/D": the spillover curve rises, the illumination curve falls, and
the aperture curve bulges in between.

### Why narrower feeds shift the optimum shallower

A bigger ESA (more elements, or wider element spacing) has a
narrower $P(\psi)$: the main lobe drops off at smaller $\psi$. Now
the two knobs re-tune:

- **Spillover** is easier to keep high — a narrower beam spills less
  even for a modest $\psi_0$.
- **Illumination** becomes the binding constraint — you must keep
  $\psi_0$ small enough that the rim still sees a healthy $P(\psi_0)$,
  otherwise the aperture is dark at the edge.

The way to satisfy both is to shrink $\psi_0$, which means a shallower
dish. So the optimum $f/D$ moves right (toward $\sim 0.6$–$1.0$) as
the feed narrows. This is the "bigger ESAs push the sweet spot
shallower" statement in the "Efficiency vs f/D" caption and the
"Gain vs array size" plot. It also feeds back into blockage (§4):
bigger ESAs cast bigger shadows, and shallower dishes are exactly
the geometry where that shadow costs the most fractional area.

### One honest caveat

$\phi$-averaging turns a rectangular-grid ESA into an axisymmetric
equivalent feed, which is what makes Silver's 1-D integrals in $\psi$
valid. A real rectangular array does not illuminate the aperture in
perfect circular rings; it has slightly different taper along the
principal planes vs the diagonals. For engineering trades at the
level this app targets — pick $f/D$, size the array, budget spillover
— the axisymmetric approximation is fine and matches Silver's
classical results. If you care about that ~few-percent asymmetry
(cross-pol lobes, sidelobe shape by cut), you want a PO solver, not
this app. See [Caveats](#caveats--where-these-first-order-models-break).

## 4. Blockage

In a prime-focus dish the feed sits on the axis, squarely in the way of
the outgoing (or incoming) aperture field. That physical shadow is
blockage, and it is the third factor in the aperture-efficiency product
$\eta_{\text{ap}} = \eta_s\,\eta_i\,\eta_b$. This section is the story
behind the "Blockage eff." KPI and the gap between the solid and dashed
curves in "Gain vs array size."

### Where the shadow comes from

The ESA at the focus has a physical footprint. In this app that
footprint is just the array's projected rectangle:

$$
A_{\text{block}} \;=\; (N_x\,d_x\,\lambda)\,(N_y\,d_y\,\lambda),
$$

with no struts, no cables, no feed housing — the array alone. The dish
aperture is $A_{\text{dish}} = \pi (D/2)^2$. The fractional area lost
to the shadow is therefore

$$
f \;=\; \frac{A_{\text{block}}}{A_{\text{dish}}}.
$$

```103:119:src/models/feed.ts
export function feedGeometry(
  feed: FeedInputs,
  frequencyHz: number,
): FeedGeometry {
  const wavelengthM = wavelengthFromFrequency(frequencyHz);
  const arraySizeXM = feed.Nx * feed.dxLambda * wavelengthM;
  const arraySizeYM = feed.Ny * feed.dyLambda * wavelengthM;
  const blockageAreaM2 = arraySizeXM * arraySizeYM;
  // ...
```

### Why the efficiency is squared

Set the aperture field to zero inside the shadow and leave it alone
outside. On boresight the far-field voltage is the coherent integral of
that aperture field. For a roughly uniform illumination the integral
shrinks exactly with the remaining area:

$$
E \;=\; E_0\,(1 - f).
$$

Gain (and on-axis power) goes as $|E|^2$, so

$$
\eta_b \;=\; (1 - f)^2 \;=\;
\left(1 - \frac{A_{\text{block}}}{A_{\text{dish}}}\right)^{2}.
$$

An equivalent picture: the blocked aperture radiates like the full
aperture *minus* a fictitious "negative" aperture the size of the
shadow. On boresight those two voltage contributions subtract in
proportion to area, and again the power ratio is $(1-f)^2$. The square
is not a free parameter — it is the voltage-to-power step.

```68:75:src/models/efficiency.ts
export function blockageEfficiency(
  apertureAreaM2: number,
  blockageAreaM2: number,
): number {
  if (apertureAreaM2 <= 0) return 0;
  const frac = Math.max(0, 1 - blockageAreaM2 / apertureAreaM2);
  return clamp01(frac * frac);
}
```

A few useful numbers from the same formula: $f = 0.05$ costs only
$\eta_b \approx 0.90$ (about $0.4\,\text{dB}$); $f = 0.10$ drops to
$\eta_b \approx 0.81$ ($\sim 0.9\,\text{dB}$); $f = 0.25$ is already
$\eta_b = 0.56$ ($\sim 2.5\,\text{dB}$). The penalty grows faster than
the area fraction itself because of that square.

### Why bigger arrays and shallower dishes hurt most

$A_{\text{block}}$ grows with $N_x N_y$ and with $\lambda^2$ (element
pitch is counted in wavelengths), while $A_{\text{dish}}$ is fixed by
$D$. So:

- **Bigger ESAs** cast bigger shadows. That is exactly the dashed-vs-solid
  gap in "Gain vs array size": growing $N$ improves spillover / lets you
  run a shallower $f/D$, but $\eta_b$ falls as $N^2$ and eventually
  wins.
- **Shallower dishes** do not change $A_{\text{block}}$ or
  $A_{\text{dish}}$ directly — both are projected areas — but they are
  exactly the geometry §3 pushes you toward once the feed narrows. The
  optical sweet spot and the blockage penalty therefore move in opposite
  directions as the array grows: you want shallow for $\eta_s\eta_i$,
  and you pay for it in $\eta_b$ because the larger array that justified
  the shallow dish is the same array casting the shadow.

### When $(1-f)^2$ under- or over-estimates

The formula is a **uniform-illumination, geometric-shadow** model. Real
blockage differs in three ways that can push the number either direction:

1. **Taper.** Typical feeds light the aperture brightest on axis — right
   where the feed's own shadow sits. Removing the brightest patch costs
   more coherent field than the area fraction $f$ suggests, so true
   $\eta_b$ is *lower* than $(1-f)^2$. The formula is optimistic
   (underestimates loss) for center-peaked illuminations.
2. **Scattered power.** The feed and its supports do not simply "delete"
   aperture field; they re-radiate. That scattered field interferes with
   the main aperture contribution. Depending on electrical size and
   phase, the interference can deepen the on-axis null (worse than the
   area model) or partially refill it (better). The simple model ignores
   this entirely.
3. **RF vs optical shadow.** As Ruze pointed out, the radio-frequency
   shadow of a strut or feed is typically wider than its geometric
   silhouette, so the effective $f$ is larger than $A_{\text{block}}/
   A_{\text{dish}}$. Again the area formula underestimates the hit.
   Struts are omitted in this app altogether, which is another reason
   the KPI is a lower bound on the real blockage penalty.

Net: for the engineering trades this app targets — is the array getting
too big for this $D$? — $(1-f)^2$ is the right order of magnitude and
the right monotonic trend. For a number you would put in a review
package, you want a PO run that includes the feed housing and struts as
scattering bodies. See [Caveats](#caveats--where-these-first-order-models-break).

### Why offset optics is the standard fix

Once $A_{\text{block}}/A_{\text{dish}}$ is no longer negligible, the
clean fix is geometric: stop putting the feed in the aperture's way.
An **offset** (or offset-fed) reflector uses only a portion of a parent
paraboloid whose focus sits *outside* the used aperture, so the feed's
shadow misses the radiating area entirely and $\eta_b \to 1$. That is
why almost every consumer satellite dish, and most modern large
reflector systems that care about aperture efficiency, are offset.

The trade is not free — offset geometry brings beam squint,
cross-polarization, and a more awkward feed-support structure — but it
removes the $N^2$ collision between "bigger array for better
illumination" and "bigger array for worse blockage" that prime-focus
designs cannot escape. This app models the prime-focus case on purpose:
blockage is one of the knobs the trade plots are meant to make visible.

### One honest caveat

$\eta_b = (1 - A_{\text{block}}/A_{\text{dish}})^2$ is an
aperture-area bookkeeping identity under uniform illumination, not a
full electromagnetic treatment of a feed sitting in front of a dish.
It does not know about strut scattering, feed-housing diffraction,
multiple-reflection paths between feed and reflector, or the fact that
an ESA is an extended partially-transparent object rather than a hard
rectangular mask. Treat the blockage KPI as a first-order tax on array
size, and escalate to a PO/MoM model when that tax starts to dominate
the link budget.

## 5. Beam Deviation Factor

Displace a feed sideways off the focus — or electronically scan an ESA
so the reflector *sees* an equivalent lateral displacement (§6) — and
the sky beam tilts. It does **not** tilt by the full geometric feed
angle. The ratio of those two angles is the Beam Deviation Factor:

$$
\text{BDF} \;=\;
\frac{\theta_{\text{sky}}}{\theta_{\text{scan}}}
\;\le\; 1.
$$

This is the number behind the "Sky beam angle" KPI
($\theta_{\text{sky}} = \text{BDF}\,\theta_{\text{scan}}$) and the
detail line `BDF = …` on that card. Everything lives in
[`src/models/scan.ts`](../src/models/scan.ts).

### Physical origin: why the beam undershoots the geometric angle

A flat mirror obeys angle-of-incidence = angle-of-reflection, so a feed
tilted by $\theta$ relative to the surface normal produces a reflected
beam tilted by the same $\theta$. A paraboloid is not flat: every
patch of the dish has its own local normal. When the feed moves off
axis (or its phase front tilts), the path-length expansion on the
aperture picks up a **linear** phase ramp — that is what re-points the
beam — but the curved surface weights that ramp less efficiently than
a flat plate would. The far-field peak therefore walks off by less than
the feed angle:

$$
\theta_{\text{sky}} \;=\; \text{BDF}\,\theta_{\text{scan}},
\qquad \text{BDF} < 1.
$$

The same linear term appeared in the aperture phase expansion of §6:

$$
\Delta(r,\phi)
\;=\;
\underbrace{\tfrac{\delta\,r}{F}\cos\phi}_{\text{linear (beam tilt)}}
\;-\;
\underbrace{\tfrac{\delta\,r^3}{4F^3}\cos\phi}_{\text{cubic (coma)}}
\;+\;\cdots
$$

BDF is the bookkeeping for the linear term (re-pointing, no loss);
coma is the bookkeeping for the cubic term (deformation, real loss).
They are the two halves of one displaced-feed picture.

### The empirical form

Lo's widely-used approximation (and the one this app ships) is

$$
\text{BDF}
\;=\;
\frac{1 + 0.36\,q^{2}}{1 + q^{2}},
\qquad
q \;=\; \frac{1}{4\,f/D} \;=\; \frac{D}{4F}.
$$

```18:21:src/models/scan.ts
export function beamDeviationFactor(fOverD: number): number {
  const q = 1 / (4 * fOverD);
  return (1 + 0.36 * q * q) / (1 + q * q);
}
```

$q$ is a pure geometry parameter: it is large when the dish is deep
(small $f/D$, large rim half-angle $\psi_0$) and small when the dish
is shallow. The $0.36$ coefficient is not derived in this file — it is
an empirical fit tuned to a typical feed taper (roughly the
$-10\,\text{dB}$-edge class of illuminations Silver / Lo analyzed).
Change the taper and the best-fit number moves a little; the functional
shape in $q$ does not.

### Why BDF $\to 1$ for shallow dishes and drops for deep ones

| $f/D$ | $q$ | dish shape | BDF | intuition |
|-------|-----|------------|-----|-----------|
| large (shallow) | $\to 0$ | almost a flat plate over the aperture | $\to 1$ | local normals barely vary; reflection looks specular |
| $\sim 0.4$–$0.5$ | $\sim 0.5$–$0.6$ | typical prime-focus | $\sim 0.85$–$0.90$ | the everyday operating point |
| $\sim 0.3$ (deep) | $\sim 0.8$ | strongly curved | $\sim 0.75$–$0.80$ | rim normals tip a lot; the linear phase is diluted |

That matches the code comment and the unit tests: `beamDeviationFactor(5)`
is $> 0.99$, and `beamDeviationFactor(0.3) < beamDeviationFactor(1.0)`.

### How the app uses it

`scanPerformance` multiplies the commanded feed scan by BDF to get the
sky angle, then feeds that sky angle into the coma-loss model (which
counts **sky** beamwidths, not feed beamwidths):

```38:48:src/models/scan.ts
  const bdf = beamDeviationFactor(reflector.fOverD);
  const skyBeamAngleRad = feedScanAngleRad * bdf;
  // ...
  const beamwidths = gain.hpbwRad > 0 ? skyBeamAngleRad / gain.hpbwRad : 0;
  const comaLossDb = comaCoefficient(reflector.fOverD) * beamwidths * beamwidths;
```

Two consequences worth keeping straight:

- For a given feed scan $\theta_{\text{scan}}$, a **deeper** dish
  produces a *smaller* sky beam angle (lower BDF) — the beam
  undershoots more.
- Coma still hurts deeper dishes worse overall, because the
  coma coefficient itself scales like $1/(f/D)^2$ (§6). BDF and
  coma coefficient both depend on $q$; they just bookkeep different
  pieces of the same displaced-feed expansion.

### One honest caveat

The $(1 + 0.36 q^2)/(1 + q^2)$ form is an **empirical fit for a
particular illumination**, not an exact diffraction result. Real BDF
also depends weakly on edge taper (more taper $\Rightarrow$ BDF a bit
closer to 1, because the dark rim contributes less to the phase
integral) and, at large scan, on the fact that the linear-phase
picture itself is a small-displacement expansion. Within the few-HPBW
regime this app claims, the fit is the standard one used in the
antenna-engineering literature and is the right first-order knob.
Beyond that, or if you care about the taper dependence explicitly, you
want a PO scan sweep — see
[Caveats](#caveats--where-these-first-order-models-break).

## 6. Scan loss: element rolloff + coma

Electronically scanning the ESA feed off boresight costs gain through
two mechanisms, both modeled in
[`src/models/scan.ts`](../src/models/scan.ts).

### Element pattern rolloff

Each ESA element radiates with a voltage pattern $\cos^{n}\theta$, so
its power pattern is $\cos^{2n}\theta$. When the array is
electronically scanned to $\theta_{\text{scan}}$, the whole array's
peak sits on that element pattern, so the composite feed loses

$$
L_{\text{el}}(\text{dB}) = -10\log_{10}\bigl(\cos^{2n}\theta_{\text{scan}}\bigr).
$$

This is the "element loss" curve in the scan-vs-angle trade plot. It's
sharp and depends only on the assumed element type ($n$), independent
of the reflector.

### Coma / defocus loss

This is the subtler one. It grows **quadratically with scanned
beamwidths** — here's why.

**Step 1: scanning the beam is optically equivalent to displacing the feed.**
Electronically scanning the ESA by $\theta_{\text{scan}}$ tilts its
outgoing plane wave; when that tilted wave lands on the reflector, the
reflector sees it exactly as it would see a point feed moved sideways
off the focal point by

$$
\delta \;\approx\; F\,\tan\theta_{\text{scan}} \;\approx\; F\,\theta_{\text{scan}}.
$$

**Step 2: the offset feed puts a cubic phase error on the aperture.**
A paraboloid is defined so that rays from a point source *at the focus*
all reach the aperture plane with the same phase — that's what "focus"
means. Once the source is displaced by $\delta$, the path length from
source to each aperture point picks up correction terms. Expanded in
aperture radius $r$ and azimuth $\phi$:

$$
\Delta(r,\phi) \;=\; \underbrace{\tfrac{\delta\,r}{F}\cos\phi}_{\text{linear (beam tilt)}}
\;-\; \underbrace{\tfrac{\delta\,r^3}{4F^3}\cos\phi}_{\text{cubic (coma)}}
\;+\;\cdots
$$

- The **linear term** is a phase ramp across the aperture — that just
  re-points the beam. It is what the Beam Deviation Factor bookkeeps;
  it is not a loss.
- The **cubic term** is asymmetric in $\phi$ (it flips sign across
  the aperture). That asymmetric phase error deforms the beam and
  bleeds power into a "coma lobe" on one side. That's where the loss
  comes from.

Crucially, the peak cubic phase error is proportional to $\delta$,
which is proportional to $\theta_{\text{scan}}$:

$$
\Delta_{\text{coma, peak}} \;\propto\; \delta \;\propto\; \theta_{\text{scan}}.
$$

**Step 3: Ruze — gain loss is quadratic in RMS phase error.**
For a small phase error $\sigma_\varphi$ (radians) across the
aperture, the Ruze approximation for on-boresight gain is

$$
\frac{G}{G_0} \;\approx\; e^{-\sigma_\varphi^{2}} \;\approx\; 1 - \sigma_\varphi^{2},
$$

so loss (as a fraction, or in dB) is quadratic in the phase error:

$$
L \;\propto\; \sigma_\varphi^{2}.
$$

**Step 4: put it together.** Coma phase error is linear in
$\theta_{\text{scan}}$; loss is quadratic in phase error; therefore
loss is quadratic in scan angle. Beamwidth
$\theta_{\text{HPBW}} \approx 1.02\,\lambda/D$ is a fixed constant of
the geometry, so equivalently

$$
L_{\text{coma}}(\text{dB}) \;\propto\; \left(\tfrac{\theta_{\text{scan}}}{\theta_{\text{HPBW}}}\right)^{2}.
$$

That's the "quadratic in beamwidths scanned" statement.

**Step 5: why deeper dishes coma faster.** The cubic term's coefficient
scales as $\delta / F^3 = \theta_{\text{scan}} / F^2$. For fixed $D$,
$F^2 \propto (f/D)^2$, so the coma phase error itself picks up an
extra factor of $1/(f/D)^2$, and since loss is quadratic in that, the
whole **coma-loss coefficient scales like** $1/(f/D)^{2}$. That is
exactly the shape used in the app:

```25:30:src/models/scan.ts
export function comaCoefficient(fOverD: number): number {
  const q = 1 / (4 * fOverD);
  return 0.05 + 0.15 * q * q;
}
```

with $q = 1/(4\,f/D) = D/(4F)$, so $q^2$ is the $1/(f/D)^2$
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

A phased array is a spatial sampler. When the element pitch $d$ is
too wide relative to $\lambda$, the sampled aperture supports more
than one propagating plane-wave solution — a grating lobe — and
scanning the main beam eventually walks one of those aliases into
visible space. This section is the story behind the "Grating-lobe
safe scan" KPI and the check in
[`src/models/grating.ts`](../src/models/grating.ts).

### The array-factor condition

For a uniform 1-D array of pitch $d$, scanned to
$\theta_{\text{scan}}$, the array factor peaks wherever the
inter-element phase wraps by an integer number of cycles:

$$
\sin\theta_g \;=\; \sin\theta_{\text{scan}} \;-\; m\,\frac{\lambda}{d},
\qquad m = \pm 1,\,\pm 2,\,\ldots
$$

$m = 0$ is the main beam ($\theta_g = \theta_{\text{scan}}$). The
first grating lobe that matters for scan is usually $m = +1$ or
$m = -1$, sitting on the opposite side of broadside from the scanned
beam. That is the same singularity the 1-D sinc in
`arrayFactor1D` already knows about — the comment
"limit as $x \to 0$ (or grating-lobe peaks)" in
[`src/models/feed.ts`](../src/models/feed.ts) is exactly this
condition, where the denominator
$\sin(\pi\,d_\lambda\,u)$ also hits zero.

### When the lobe enters real space

Visible space is $|\sin\theta| \le 1$. The most aggressive grating
lobe walks in from the horizon opposite the scan
($\theta_g = -90^\circ$, $\sin\theta_g = -1$) when

$$
-1 \;=\; \sin\theta_{\text{scan}} \;-\; \frac{\lambda}{d}
\qquad\Rightarrow\qquad
\sin\theta_{\text{scan, max}} \;=\; \frac{\lambda}{d} - 1.
$$

That is the max-scan angle the app reports. Beyond it, a grating
lobe is a real propagating direction, not an evanescent alias, and
the feed starts dumping power into a second beam.

```12:28:src/models/grating.ts
export function gratingCheck(
  feed: FeedInputs,
  feedScanAngleRad: number,
): GratingResult {
  const maxPitchLambda = Math.max(feed.dxLambda, feed.dyLambda);
  const arg = 1 / maxPitchLambda - 1;
  let maxScanBeforeGratingRad: number;
  if (arg >= 1) {
    maxScanBeforeGratingRad = Math.PI / 2;
  } else if (arg <= -1) {
    maxScanBeforeGratingRad = 0;
  } else {
    maxScanBeforeGratingRad = Math.asin(arg);
  }
  const currentScanSafe =
    Math.abs(feedScanAngleRad) <= maxScanBeforeGratingRad + 1e-9;
  return { maxPitchLambda, maxScanBeforeGratingRad, currentScanSafe };
}
```

The rectangular array has two pitches; the check uses
$d_{\max} = \max(d_x, d_y)$ because the wider spacing is the one that
grates first.

### The "$d \le \lambda/2$" special case

If $d \le \lambda/2$, then $\lambda/d - 1 \ge 1$. The right-hand
side of the max-scan equation is already past $\sin\theta = 1$, so
there is **no real $\theta_{\text{scan}}$** that brings a grating
lobe into visible space — even a scan all the way to the horizon is
clean. The code treats that as `arg >= 1` and reports
$\theta_{\max} = \pi/2$, which the KPI card renders as
"unlimited."

That is why $\lambda/2$ spacing is the textbook default for
wide-scan ESAs. Push $d$ above $\lambda/2$ and the allowed scan
cone shrinks fast. A worked example from the unit tests: at
$d = 0.9\,\lambda$,

$$
\sin\theta_{\max} \;=\; \tfrac{1}{0.9} - 1 \;\approx\; 0.111
\qquad\Rightarrow\qquad
\theta_{\max} \;\approx\; 6.4^\circ.
$$

At $d = \lambda$, $\theta_{\max} = 0$ — grating lobes sit exactly
on the horizon even at broadside. Past $d = \lambda$, they are
already inside visible space with the beam unscanned, and the check
correctly refuses every nonzero scan.

### What this means for the reflector

Grating lobes are a property of the **feed**, not of the dish. Once
one is in visible space it does two bad things to a prime-focus
system:

1. **Wasted power.** Energy that should have been in the main feed
   beam is shared with a second lobe, so the on-axis feed directivity
   drops and spillover / illumination integrals (§3) are no longer
   computing what you think.
2. **A second illumination path.** Depending on where $\theta_g$
   points, that lobe may miss the dish entirely (pure spillover
   loss) or light a different patch of the reflector (a second,
   aberrated aperture contribution). Either way the single-beam
   picture this app assumes is broken.

The KPI is therefore a hard gate, not a soft efficiency factor:
`currentScanSafe` flips the card to "CURRENT SCAN UNSAFE" the moment
$|\theta_{\text{scan}}|$ exceeds $\theta_{\max}$. It does not try to
fold grating-lobe power into $\eta_s$ or the scan-loss budget — once
you are past the gate, the other first-order models are no longer
trustworthy.

### One honest caveat

The $\sin\theta_g = \sin\theta_{\text{scan}} - m\lambda/d$ condition
is for an ideal infinite (or large uniform) array in free space. Real
ESAs soften it in both directions: the element pattern
$\cos^{n}\theta$ partially suppresses wide-angle grating lobes, so
the first lobe to enter visible space may be weaker than the array
factor alone suggests; mutual coupling, scan blindness, and finite
array size move the effective onset around. The app's check is the
classical geometric gate — the angle at which a grating lobe
*exists* in visible space — and it is the right first-order go/no-go
for element pitch vs scan. Quantifying how much power that lobe
actually carries wants a full-wave array model, not this app.

## Caveats & where these first-order models break

- **Physical optics.** Every efficiency here is a scalar integral over
  an assumed feed pattern. Real reflector behavior includes edge
  diffraction, cross-polarization, and near-field effects that a full
  physical-optics (PO) or method-of-moments (MoM) solver captures
  and this app does not.
- **Feed idealizations.** The ESA is modeled as an ideal uniform array
  of $\cos^{n}\theta$ elements with no mutual coupling, no scan
  blindness, and no active-impedance variation. Real arrays deviate
  meaningfully from this at wide scan.
- **Coma model.** As noted above, the coma term is a Ruze-style
  small-perturbation quadratic. It is progressively optimistic beyond
  a few HPBWs of scan.
- **Blockage model.** $\eta_b = (1 - A_b/A_d)^2$ treats blockage as a
  simple aperture-area loss; the real story includes scattered-power
  interference patterns that can push the number either way.
- **BDF form.** The $(1 + 0.36 q^2)/(1 + q^2)$ approximation is a
  widely-used empirical fit, not an exact result — it assumes a
  particular feed illumination.
- **Surface error, pointing error, RF losses, ohmic losses.** All
  ignored. Real $G$ is $\eta_{\text{ap}}$ times more penalties
  than this app tracks.

If you need numbers you can defend in a review, use this app to build
intuition and to pick a starting design point, then hand that design
to a real reflector solver.
