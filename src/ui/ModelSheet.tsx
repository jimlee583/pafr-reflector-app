import { useEffect, useRef } from "react";
import { Equation } from "./Equation";
import { EQUATION_SECTIONS } from "./equations";

interface ModelSheetProps {
  open: boolean;
  focusId?: string;
  onToggle: () => void;
  onClose: () => void;
}

export function ModelSheet({ open, focusId, onToggle, onClose }: ModelSheetProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const root = bodyRef.current;
    if (!root) return;
    const targetId = focusId ? `eq-${focusId}` : null;
    const target = targetId ? root.querySelector<HTMLElement>(`#${cssId(targetId)}`) : null;
    if (target) {
      // Use container scroll so the sheet stays fixed but the equation is centered.
      const top =
        target.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        12;
      root.scrollTo({ top, behavior: "smooth" });
      target.classList.add("eq-flash");
      const t = window.setTimeout(() => target.classList.remove("eq-flash"), 1400);
      return () => window.clearTimeout(t);
    } else {
      root.scrollTo({ top: 0 });
    }
  }, [open, focusId]);

  return (
    <>
      <button
        type="button"
        className="assumptions-toggle"
        onClick={onToggle}
        aria-expanded={open}
      >
        {open ? "hide model & equations" : "model & equations"}
      </button>
      {open && (
        <div
          className="model-sheet"
          role="dialog"
          aria-modal="false"
          aria-label="Model assumptions and equations"
        >
          <div className="model-sheet-header">
            <h3>Model &amp; equations</h3>
            <button
              type="button"
              className="model-sheet-close"
              onClick={onClose}
              aria-label="Close model sheet"
            >
              close
            </button>
          </div>
          <div className="model-sheet-body" ref={bodyRef}>
            <Assumptions />
            <div className="model-sheet-equations">
              {EQUATION_SECTIONS.map((section) => (
                <section key={section.id} className="eq-section">
                  <div className="eq-section-header">
                    <h4>{section.title}</h4>
                    {section.sourceFile && (
                      <code className="eq-source">{section.sourceFile}</code>
                    )}
                  </div>
                  {section.intro && <p className="eq-intro">{section.intro}</p>}
                  <ol className="eq-list">
                    {section.entries.map((entry) => (
                      <li
                        key={entry.id}
                        id={`eq-${entry.id}`}
                        className="eq-entry"
                      >
                        <div className="eq-entry-header">
                          <span className="eq-title">{entry.title}</span>
                          {entry.heuristic && (
                            <span className="eq-heuristic" title="First-order / heuristic">
                              heuristic
                            </span>
                          )}
                        </div>
                        <Equation latex={entry.latex} ariaLabel={entry.title} />
                        <p className="eq-caption">{entry.caption}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
            <p className="model-sheet-footer">
              Every number in this app is a first-order estimate suitable for
              teaching and early trade studies. Full derivations and caveats
              live in <code>docs/physics-notes.md</code>.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function Assumptions() {
  return (
    <div className="model-sheet-assumptions">
      <h4>Assumptions</h4>
      <ul>
        <li>
          <strong>Reflector.</strong> Prime-focus, symmetric paraboloid. No
          offset, no sub-reflector, no shaping.
        </li>
        <li>
          <strong>ESA feed.</strong> Rectangular grid, uniform amplitude,
          cos<sup>n</sup>(&theta;) element voltage pattern (no back
          radiation). Feed sits exactly at the focus. No mutual coupling, no
          polarization loss.
        </li>
        <li>
          <strong>Efficiencies.</strong> Silver&rsquo;s classic axisymmetric
          spillover / taper integrals over the &phi;-averaged feed
          intensity; blockage is a central rectangular shadow.
        </li>
        <li>
          <strong>Scan.</strong> Beam Deviation Factor and coma / defocus
          loss are first-order / heuristic; element rolloff is exact
          cos<sup>2n</sup>(&theta;<sub>scan</sub>).
        </li>
        <li>
          <strong>Out of scope.</strong> Full-wave EM, PO / MoM, Ruze surface
          error, offset / Cassegrain / Gregorian optics, polarization,
          amplitude taper beyond uniform.
        </li>
      </ul>
    </div>
  );
}

function cssId(id: string): string {
  // querySelector needs a CSS-escaped id. We control the id space, but
  // stay safe if a future equation id contains punctuation.
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(id);
  return id.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}
