import { useMemo } from "react";
import katex from "katex";

interface EquationProps {
  latex: string;
  display?: boolean;
  ariaLabel?: string;
  className?: string;
}

/**
 * Small KaTeX wrapper. `display` renders as a block equation (centered,
 * larger); otherwise it's inline. `ariaLabel` provides a plaintext
 * fallback for screen readers since KaTeX output is visual.
 */
export function Equation({
  latex,
  display = true,
  ariaLabel,
  className,
}: EquationProps) {
  const html = useMemo(
    () =>
      katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        strict: "ignore",
        output: "html",
      }),
    [latex, display],
  );

  const Tag = display ? "div" : "span";
  return (
    <Tag
      className={
        (display ? "eq-block" : "eq-inline") +
        (className ? " " + className : "")
      }
      role="math"
      aria-label={ariaLabel ?? latex}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
