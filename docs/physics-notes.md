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

TBD — rim half-angle $\psi_0 = 2\arctan\bigl(1/(4\,f/D)\bigr)$, depth
$D^2/(16F)$, focus-to-rim distance from the polar equation
$\rho(\psi) = 2F/(1 + \cos\psi)$, and where each of those shows up in
[`src/models/geometry.ts`](../src/models/geometry.ts).

## 2. Feed model

TBD — element voltage pattern $\cos^{n}\theta$, rectangular-array
factor as a product of 1-D sincs, $\phi$-averaged intensity used for
the axisymmetric reflector integrals. Reference:
[`src/models/feed.ts`](../src/models/feed.ts).

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

TBD — physical origin (feed offset produces beam tilt but not the full
geometric angle), the empirical
$(1 + 0.36 q^2)/(1 + q^2)$ form with $q = 1/(4\,f/D)$, and why
BDF approaches 1 for shallow dishes and drops for deep ones.
Reference: [`src/models/scan.ts`](../src/models/scan.ts).

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

TBD — the $\sin\theta_g = \sin\theta_{\text{scan}} - m\lambda/d$
condition, the "unconstrained if $d \le \lambda/2$" special case,
and how the max-scan check in
[`src/models/grating.ts`](../src/models/grating.ts) drops out of it.

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
