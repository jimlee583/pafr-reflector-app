import { useMemo, useState } from "react";
import { computePAFR } from "./models";
import type { PAFRInputs } from "./models/types";
import { AssumptionsDrawer } from "./ui/AssumptionsDrawer";
import { DEFAULT_INPUTS } from "./ui/defaults";
import { GeometryView } from "./ui/GeometryView";
import { IlluminationView } from "./ui/IlluminationView";
import { InputPanel } from "./ui/InputPanel";
import { KpiCards } from "./ui/KpiCards";
import { TradePlots } from "./ui/TradePlots";

export default function App() {
  const [inputs, setInputs] = useState<PAFRInputs>(DEFAULT_INPUTS);
  const result = useMemo(() => computePAFR(inputs), [inputs]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>PAFR Reflector Illumination App</h1>
        <span className="badge">approximate &middot; first-order models</span>
        <span className="header-spacer" />
        <button
          type="button"
          className="header-reset"
          onClick={() => setInputs(DEFAULT_INPUTS)}
        >
          reset defaults
        </button>
        <AssumptionsDrawer />
      </header>
      <div className="app-body">
        <InputPanel inputs={inputs} feed={result.feed} onChange={setInputs} />
        <main className="app-main">
          <section className="panel kpis">
            <h2>KPIs</h2>
            <KpiCards result={result} />
          </section>
          <section className="panel geometry">
            <h2>Side view</h2>
            <GeometryView result={result} feedScanAngleRad={inputs.scan.feedScanAngleRad} />
            <h2 style={{ marginTop: 12 }}>Aperture illumination (radial cut)</h2>
            <IlluminationView inputs={inputs} result={result} />
          </section>
          <section className="panel plots">
            <h2>Trade curves</h2>
            <TradePlots inputs={inputs} />
          </section>
        </main>
      </div>
    </div>
  );
}
