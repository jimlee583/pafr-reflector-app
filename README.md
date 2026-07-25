# PAFR Reflector Illumination App

Interactive learning + first-order design sketchpad for **phased-array-fed reflector (PAFR)** systems.

Point a small ESA (electronically scanned array) at the focus of a parabolic reflector, tune the geometry, and see how f/D, dish size, frequency, and array design trade off across:

- Spillover efficiency
- Illumination (taper) efficiency
- Aperture blockage
- Directivity / gain
- Electronic-scan loss and grating-lobe limits

The app is meant for **intuition and early trades**, not full-wave analysis.

## Approximate on purpose

Every KPI shown is a **first-order, closed-form** estimate. Assumptions:

- Prime-focus, symmetric paraboloid (no offset, no sub-reflector)
- ESA modeled as a rectangular array with a `cos^n(theta)` element pattern and a chosen amplitude taper; feed placed centered on the focal point
- Spillover / illumination integrals over the axially-symmetric feed pattern (`phi`-averaged)
- Blockage treated as a simple central obstruction of the array's physical footprint
- Scan loss uses a paraxial beam-deviation / defocus approximation
- No mutual coupling, no polarization effects, no random surface error

These are appropriate for early-stage exploration and teaching. They will disagree with a full physical-optics / method-of-moments solver, especially at wide scan or low f/D.

## Getting started

```bash
npm install
npm run dev      # start Vite dev server
npm test         # run model unit tests
npm run build    # production build
```

## Project layout

```
src/
  models/   pure-TS physics (geometry, efficiency, gain, scan, blockage) + tests
  ui/       React panels, KPI cards, geometry SVG, plots
  App.tsx
  main.tsx
```

The `src/models/` directory is UI-agnostic and unit-tested with Vitest, so the physics can be reused or replaced independently of the interface.
