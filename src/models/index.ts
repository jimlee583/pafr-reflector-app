// Top-level facade: takes a PAFRInputs bundle and returns a full PAFRResult
// by composing the individual model modules.

import { reflectorGeometry } from "./geometry";
import { edgeTaperDb, efficiencies } from "./efficiency";
import { feedGeometry } from "./feed";
import { gainFromAperture } from "./gain";
import { gratingCheck } from "./grating";
import { scanPerformance } from "./scan";
import type { PAFRInputs, PAFRResult } from "./types";

export * from "./constants";
export * from "./types";
export * as Geometry from "./geometry";
export * as Feed from "./feed";
export * as Efficiency from "./efficiency";
export * as Gain from "./gain";
export * as Scan from "./scan";
export * as Grating from "./grating";

export function computePAFR(inputs: PAFRInputs): PAFRResult {
  const reflector = reflectorGeometry(inputs.reflector);
  const feed = feedGeometry(inputs.feed, inputs.rf.frequencyHz);

  const eff = efficiencies(
    inputs.feed,
    reflector.rimHalfAngleRad,
    reflector.apertureAreaM2,
    feed.blockageAreaM2,
  );

  feed.edgeTaperDb = edgeTaperDb(inputs.feed, reflector.rimHalfAngleRad);

  const gain = gainFromAperture(
    eff.aperture,
    reflector.diameterM,
    feed.wavelengthM,
  );

  const scan = scanPerformance(
    inputs.scan.feedScanAngleRad,
    inputs.feed.elementCosExponentN,
    reflector,
    gain,
  );

  const grating = gratingCheck(inputs.feed, inputs.scan.feedScanAngleRad);

  return {
    wavelengthM: feed.wavelengthM,
    reflector,
    feed,
    efficiencies: eff,
    gain,
    scan,
    grating,
  };
}
