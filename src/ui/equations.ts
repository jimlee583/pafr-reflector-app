// Catalog of every equation the app actually computes.
//
// Each entry pairs a LaTeX source string with a short caption. The `id`
// doubles as a scroll target inside the model & equations sheet, so
// KPI cards can deep-link with #eq-<id>.
//
// Kept as data (not JSX) so both the sheet and the KPI cards can read
// from a single source.

export interface EquationEntry {
  id: string;
  title: string;
  latex: string;
  caption: string;
  /** Set true for models the physics-notes flags as first-order / heuristic. */
  heuristic?: boolean;
}

export interface EquationSection {
  id: string;
  title: string;
  intro?: string;
  sourceFile?: string;
  entries: EquationEntry[];
}

export const EQUATION_SECTIONS: EquationSection[] = [
  {
    id: "geometry",
    title: "1. Reflector geometry",
    intro:
      "Prime-focus paraboloid. Everything downstream (spillover, blockage, coma, BDF) is keyed off the diameter D and the focal ratio f/D.",
    sourceFile: "src/models/geometry.ts",
    entries: [
      {
        id: "focal-length",
        title: "Focal length",
        latex: String.raw`F \;=\; (f/D)\,D`,
        caption: "F sets the focus position and appears in every geometry equation below.",
      },
      {
        id: "rim-half-angle",
        title: "Rim half-angle",
        latex: String.raw`\psi_0 \;=\; 2\arctan\!\left(\frac{1}{4\,f/D}\right)`,
        caption:
          "Half-angle from focus to the reflector rim. Silver's efficiency integrals stop at ψ₀.",
      },
      {
        id: "depth",
        title: "Dish depth",
        latex: String.raw`\text{depth} \;=\; \frac{D^{2}}{16\,F}`,
        caption: "Axial distance from vertex to aperture plane.",
      },
      {
        id: "polar",
        title: "Focus-to-surface distance",
        latex: String.raw`\rho(\psi) \;=\; \frac{2F}{1 + \cos\psi}`,
        caption:
          "Polar form of the parabola from the focus. Drives the 1/ρ² space loss that shows up in the edge taper.",
      },
      {
        id: "aperture-area",
        title: "Aperture area",
        latex: String.raw`A_{\text{dish}} \;=\; \pi\!\left(\frac{D}{2}\right)^{\!2}`,
        caption:
          "Projected (not curved) area. Denominator of the blockage fraction and part of the gain formula.",
      },
    ],
  },

  {
    id: "feed",
    title: "2. ESA feed model",
    intro:
      "Rectangular Nx×Ny array of cosⁿ(θ) elements at the focus. Layered as element pattern × array factor, then φ-averaged so the axisymmetric dish integrals can use it.",
    sourceFile: "src/models/feed.ts",
    entries: [
      {
        id: "element-pattern",
        title: "Element voltage pattern",
        latex: String.raw`E_{\text{el}}(\theta) \;=\; \cos^{n}\theta,\qquad \theta<\tfrac{\pi}{2}`,
        caption:
          "Zero at and beyond θ = 90°. Power goes as cos²ⁿ(θ); the same rolloff drives element scan loss.",
      },
      {
        id: "array-factor",
        title: "Array factor (1-D)",
        latex: String.raw`\mathrm{AF}_{1\mathrm{D}}(u) \;=\; \frac{\sin(N\,\pi\,d\,u)}{N\,\sin(\pi\,d\,u)},\qquad u=\sin\theta\cos\phi\ \text{or}\ \sin\theta\sin\phi`,
        caption:
          "Uniform-taper Dirichlet kernel with peak 1 at boresight. The 2-D factor is the product AF(uₓ)·AF(u_y).",
      },
      {
        id: "feed-intensity",
        title: "Full feed intensity",
        latex: String.raw`\bigl|F(\theta,\phi)\bigr|^{2} \;=\; \bigl|E_{\text{el}}(\theta)\bigr|^{2}\,\bigl|\mathrm{AF}(\theta,\phi)\bigr|^{2}`,
        caption: "Peak normalized to 1 at boresight; absolute scale cancels in every efficiency ratio.",
      },
      {
        id: "feed-axi",
        title: "φ-averaged intensity",
        latex: String.raw`P(\psi) \;=\; \bigl\langle |F(\psi,\phi)|^{2} \bigr\rangle_{\phi}`,
        caption:
          "Rectangular grid has 90° symmetry, so averaging φ over [0, π/2] suffices. This is what §3 integrates.",
      },
      {
        id: "feed-directivity",
        title: "Peak feed directivity",
        latex: String.raw`D_f \;=\; \frac{4\pi}{2\pi\!\displaystyle\int_{0}^{\pi/2} P(\theta)\,\sin\theta\,d\theta}`,
        caption:
          "Element pattern kills the back hemisphere, so the total-power integral only runs to π/2.",
      },
      {
        id: "array-size",
        title: "Physical array size",
        latex: String.raw`A_{\text{block}} \;=\; (N_x\,d_x\,\lambda)\,(N_y\,d_y\,\lambda)`,
        caption: "Feeds directly into the central-shadow blockage model.",
      },
    ],
  },

  {
    id: "efficiencies",
    title: "3. Efficiencies",
    intro:
      "Silver's classic axisymmetric formulas for spillover and taper (Balanis, Antenna Theory), plus a simple central-shadow blockage.",
    sourceFile: "src/models/efficiency.ts",
    entries: [
      {
        id: "spillover",
        title: "Spillover efficiency",
        latex: String.raw`\eta_s \;=\; \frac{\displaystyle\int_{0}^{\psi_0} P(\psi)\,\sin\psi\;d\psi}{\displaystyle\int_{0}^{\pi/2} P(\psi)\,\sin\psi\;d\psi}`,
        caption:
          "Fraction of radiated power captured by the rim. Denominator stops at π/2 because the element pattern has no back hemisphere.",
      },
      {
        id: "illumination",
        title: "Illumination (taper) efficiency",
        latex: String.raw`\eta_i \;=\; 2\cot^{2}\!\!\left(\tfrac{\psi_0}{2}\right)\; \frac{\left|\displaystyle\int_{0}^{\psi_0}\!\sqrt{P(\psi)}\,\tan\!\left(\tfrac{\psi}{2}\right)d\psi\right|^{2}}{\displaystyle\int_{0}^{\psi_0} P(\psi)\,\sin\psi\;d\psi}`,
        caption:
          "How uniformly the captured power lights up the aperture. Uniform illumination gives η_i = 1; a heavily tapered feed drops it.",
      },
      {
        id: "blockage",
        title: "Blockage efficiency",
        latex: String.raw`\eta_b \;=\; \max\!\left(0,\; 1 - \frac{A_{\text{block}}}{A_{\text{dish}}}\right)^{\!2}`,
        caption:
          "Uniform-illumination, geometric-shadow model. Optimistic for real illuminations with a peaked center.",
      },
      {
        id: "aperture-efficiency",
        title: "Aperture efficiency",
        latex: String.raw`\eta_{\text{ap}} \;=\; \eta_s\,\eta_i\,\eta_b`,
        caption: "Product of the three terms above; drives the peak gain.",
      },
      {
        id: "edge-taper",
        title: "Edge taper",
        latex: String.raw`T_{\text{edge}}(\mathrm{dB}) \;=\; 10\log_{10} P(\psi_0)\;-\;20\log_{10}\!\left(\frac{1}{\cos^{2}(\psi_0/2)}\right)`,
        caption:
          "Feed rolloff at the rim plus the extra 1/ρ² space loss between focus and rim.",
      },
    ],
  },

  {
    id: "gain",
    title: "4. Gain and beamwidth",
    sourceFile: "src/models/gain.ts",
    entries: [
      {
        id: "gain",
        title: "Peak gain (broadside)",
        latex: String.raw`G \;=\; \eta_{\text{ap}}\,\left(\frac{\pi D}{\lambda}\right)^{\!2}`,
        caption:
          "First-order lossless directivity. dBi = 10·log₁₀(G).",
      },
      {
        id: "hpbw",
        title: "Half-power beamwidth",
        latex: String.raw`\theta_{\text{HPBW}} \;\approx\; \frac{1.02\,\lambda}{D}`,
        caption:
          "Uniform-aperture value in radians. Not corrected for taper in v1, so it slightly underestimates real HPBW.",
        heuristic: true,
      },
    ],
  },

  {
    id: "scan",
    title: "5. Electronic scan loss",
    intro:
      "Off-axis scan mixes three effects: the reflector points the sky beam a bit less than the feed swings (BDF), the elements themselves roll off, and coma/defocus builds quadratically with scanned beamwidths.",
    sourceFile: "src/models/scan.ts",
    entries: [
      {
        id: "q",
        title: "Deep-dish parameter q",
        latex: String.raw`q \;=\; \frac{1}{4\,f/D} \;=\; \tan\!\left(\tfrac{\psi_0}{2}\right)`,
        caption: "One knob shared by BDF and the coma coefficient.",
      },
      {
        id: "bdf",
        title: "Beam Deviation Factor",
        latex: String.raw`\mathrm{BDF} \;=\; \frac{1 + 0.36\,q^{2}}{1 + q^{2}}`,
        caption:
          "Empirical form (Lo). BDF → 1 for shallow dishes, ~0.7–0.8 for deep dishes.",
        heuristic: true,
      },
      {
        id: "sky-beam",
        title: "Sky beam angle",
        latex: String.raw`\theta_{\text{sky}} \;=\; \mathrm{BDF}\cdot\theta_{\text{scan}}`,
        caption:
          "The reflector maps the feed's electronic scan to a slightly smaller sky angle.",
      },
      {
        id: "element-loss",
        title: "Element pattern loss",
        latex: String.raw`L_{\text{el}}(\mathrm{dB}) \;=\; -10\,\log_{10}\!\bigl(\cos^{2n}\theta_{\text{scan}}\bigr)`,
        caption:
          "Comes directly from the |cosⁿ(θ)|² element pattern evaluated at the scan angle.",
      },
      {
        id: "coma",
        title: "Coma / defocus loss",
        latex: String.raw`L_{\text{coma}}(\mathrm{dB}) \;=\; c(q)\,\left(\frac{\theta_{\text{sky}}}{\theta_{\text{HPBW}}}\right)^{\!2},\quad c(q) \;=\; 0.05 + 0.15\,q^{2}`,
        caption:
          "Heuristic quadratic in beamwidths scanned; deeper dishes coma faster. Tuned so f/D = 0.4 gives ~1 dB at 3 HPBWs.",
        heuristic: true,
      },
      {
        id: "total-scan-loss",
        title: "Total scan loss",
        latex: String.raw`L_{\text{total}} \;=\; L_{\text{el}} + L_{\text{coma}},\qquad G_{\text{scanned}} \;=\; G_{\text{dBi}} - L_{\text{total}}`,
        caption: "Peak gain minus the total scan penalty.",
      },
    ],
  },

  {
    id: "grating",
    title: "6. Grating-lobe limit",
    sourceFile: "src/models/grating.ts",
    entries: [
      {
        id: "grating",
        title: "Maximum grating-lobe-free scan",
        latex: String.raw`\sin\theta_{\max} \;=\; \frac{\lambda}{d} - 1`,
        caption:
          "First grating lobe enters visible space when d/λ·(sinθ + 1) = 1. If d ≤ λ/2 the constraint disappears and any scan is safe.",
      },
    ],
  },
];

/**
 * Every KPI card can point at one equation `id` above. This map keeps
 * the wiring in one place so KpiCards.tsx doesn't hardcode strings.
 */
export const KPI_TO_EQUATION_ID: Record<string, string> = {
  "Gain (broadside)": "gain",
  "Aperture efficiency": "aperture-efficiency",
  "Spillover eff.": "spillover",
  "Illumination eff.": "illumination",
  "Blockage eff.": "blockage",
  HPBW: "hpbw",
  "Scan loss (total)": "total-scan-loss",
  "Sky beam angle": "sky-beam",
  "Scanned gain": "total-scan-loss",
  "Grating-lobe safe scan": "grating",
  "Feed directivity": "feed-directivity",
  "Reflector focal length": "focal-length",
};

/** Compact one-liner shown on the KPI card itself. */
export const KPI_FORMULA_HINT: Record<string, string> = {
  "Gain (broadside)": String.raw`G = \eta_{\text{ap}}\,(\pi D/\lambda)^{2}`,
  "Aperture efficiency": String.raw`\eta_{\text{ap}} = \eta_s\,\eta_i\,\eta_b`,
  "Spillover eff.": String.raw`\eta_s = \int_0^{\psi_0}\!P\sin\psi\,/\!\int_0^{\pi/2}\!P\sin\psi`,
  "Illumination eff.": String.raw`\eta_i \propto \bigl|\!\int_0^{\psi_0}\!\!\sqrt{P}\tan(\psi/2)\bigr|^{2}`,
  "Blockage eff.": String.raw`\eta_b = (1 - A_b/A_d)^{2}`,
  HPBW: String.raw`\theta_{\text{HPBW}} \approx 1.02\,\lambda/D`,
  "Scan loss (total)": String.raw`L_{\text{total}} = L_{\text{el}} + L_{\text{coma}}`,
  "Sky beam angle": String.raw`\theta_{\text{sky}} = \mathrm{BDF}\cdot\theta_{\text{scan}}`,
  "Scanned gain": String.raw`G_{\text{scanned}} = G - L_{\text{total}}`,
  "Grating-lobe safe scan": String.raw`\sin\theta_{\max} = \lambda/d - 1`,
  "Feed directivity": String.raw`D_f = 4\pi\,/\!\int |F|^{2}\,d\Omega`,
  "Reflector focal length": String.raw`F = (f/D)\,D`,
};
