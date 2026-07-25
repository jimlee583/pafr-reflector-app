import { useState } from "react";

export function AssumptionsDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="assumptions-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? "hide model assumptions" : "model assumptions"}
      </button>
      {open && (
        <div className="assumptions-drawer" role="region" aria-label="Model assumptions">
          <h3>Model assumptions</h3>
          <ul>
            <li>
              <strong>Reflector.</strong> Prime-focus, symmetric paraboloid.
              Rim half-angle &psi;<sub>0</sub> = 2&middot;atan(1 / (4&middot;f/D)).
              Depth = D<sup>2</sup> / (16&middot;F). No offset, no
              sub-reflector, no shaping.
            </li>
            <li>
              <strong>ESA feed.</strong> Rectangular grid, uniform amplitude,
              cos<sup>n</sup>(&theta;) element voltage pattern (no back
              radiation). Feed is centered exactly at the focus. No mutual
              coupling, no polarization loss.
            </li>
            <li>
              <strong>Efficiencies.</strong> Silver&rsquo;s classic
              axisymmetric formulas for spillover and taper, computed from
              the &phi;-averaged feed intensity. Blockage modeled as a
              central rectangular shadow of area L<sub>x</sub>&middot;L<sub>y</sub>
              (power loss = (1 &minus; A<sub>block</sub>/A<sub>dish</sub>)<sup>2</sup>).
            </li>
            <li>
              <strong>Gain.</strong> G = &eta;<sub>ap</sub> &middot;
              (&pi;D/&lambda;)<sup>2</sup>. HPBW = 1.02&middot;&lambda;/D
              (uniform-aperture value; not corrected for taper).
            </li>
            <li>
              <strong>Scan.</strong> Beam Deviation Factor from the
              (1 + 0.36 q<sup>2</sup>) / (1 + q<sup>2</sup>) approximation with
              q = 1/(4&middot;f/D). Element-pattern rolloff is exact
              cos<sup>2n</sup>(&theta;<sub>scan</sub>). Coma / defocus loss
              is a heuristic quadratic in scanned beamwidths whose
              coefficient scales with 1/(f/D)<sup>2</sup>.
            </li>
            <li>
              <strong>Grating lobes.</strong> Max scan =
              asin(&lambda;/d &minus; 1); unlimited if d &le; &lambda;/2.
            </li>
            <li>
              <strong>Explicitly out of scope.</strong> Full-wave EM,
              method-of-moments, physical-optics aperture integration,
              random surface error (Ruze), offset / Gregorian / Cassegrain
              optics, multi-band simultaneous analysis, polarization, feed
              defocus along the axis.
            </li>
          </ul>
          <p className="assumptions-footer">
            Every number in this app is a first-order estimate suitable for
            teaching and early trade studies. Expect meaningful disagreement
            with a full-wave solver, especially at low f/D or wide scan.
          </p>
        </div>
      )}
    </>
  );
}
