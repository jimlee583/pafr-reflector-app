// Grating-lobe / max-scan check for a rectangular phased array.
//
// The first grating lobe of a uniform 1-D array at spacing d appears when
//   d/lambda * (sin(theta_scan) + 1) = 1
// (for a grating lobe at theta = -pi/2). Solving:
//   sin(theta_max) = lambda/d - 1.
// If lambda/d - 1 >= 1 (i.e., d/lambda <= 0.5), there is no grating-lobe
// constraint in visible space and theta_max = pi/2.

import type { FeedInputs, GratingResult } from "./types";

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
