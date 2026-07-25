import type { PAFRInputs } from "../models/types";
import { fmtDeg, fmtGHz, fmtMeters } from "./format";

interface Props {
  inputs: PAFRInputs;
  onChange: (next: PAFRInputs) => void;
}

export function InputPanel({ inputs, onChange }: Props) {
  const set = <K extends keyof PAFRInputs>(key: K, value: PAFRInputs[K]) =>
    onChange({ ...inputs, [key]: value });

  const setR = (patch: Partial<PAFRInputs["reflector"]>) =>
    set("reflector", { ...inputs.reflector, ...patch });
  const setF = (patch: Partial<PAFRInputs["feed"]>) =>
    set("feed", { ...inputs.feed, ...patch });
  const setRF = (patch: Partial<PAFRInputs["rf"]>) =>
    set("rf", { ...inputs.rf, ...patch });
  const setS = (patch: Partial<PAFRInputs["scan"]>) =>
    set("scan", { ...inputs.scan, ...patch });

  const scanDeg = (inputs.scan.feedScanAngleRad * 180) / Math.PI;

  return (
    <aside className="panel input-panel">
      <Section title="Reflector">
        <Slider
          label={`Diameter D = ${fmtMeters(inputs.reflector.diameterM)}`}
          value={inputs.reflector.diameterM}
          min={0.1}
          max={10}
          step={0.05}
          onChange={(v) => setR({ diameterM: v })}
        />
        <Slider
          label={`f/D = ${inputs.reflector.fOverD.toFixed(2)}`}
          value={inputs.reflector.fOverD}
          min={0.25}
          max={2.0}
          step={0.01}
          onChange={(v) => setR({ fOverD: v })}
        />
      </Section>

      <Section title="RF">
        <Slider
          label={`Frequency = ${fmtGHz(inputs.rf.frequencyHz)}`}
          value={inputs.rf.frequencyHz / 1e9}
          min={1}
          max={100}
          step={0.5}
          onChange={(v) => setRF({ frequencyHz: v * 1e9 })}
        />
      </Section>

      <Section title="ESA feed">
        <Row>
          <NumberField
            label="Nx"
            value={inputs.feed.Nx}
            min={1}
            max={64}
            step={1}
            onChange={(v) => setF({ Nx: Math.round(v) })}
          />
          <NumberField
            label="Ny"
            value={inputs.feed.Ny}
            min={1}
            max={64}
            step={1}
            onChange={(v) => setF({ Ny: Math.round(v) })}
          />
        </Row>
        <Slider
          label={`dx = ${inputs.feed.dxLambda.toFixed(2)} \u03bb`}
          value={inputs.feed.dxLambda}
          min={0.3}
          max={1.5}
          step={0.01}
          onChange={(v) => setF({ dxLambda: v, dyLambda: v })}
        />
        <Slider
          label={`element cos^n, n = ${inputs.feed.elementCosExponentN.toFixed(1)}`}
          value={inputs.feed.elementCosExponentN}
          min={0}
          max={4}
          step={0.1}
          onChange={(v) => setF({ elementCosExponentN: v })}
        />
      </Section>

      <Section title="Electronic scan">
        <Slider
          label={`Feed scan = ${fmtDeg(inputs.scan.feedScanAngleRad, 2)}`}
          value={scanDeg}
          min={0}
          max={60}
          step={0.5}
          onChange={(v) => setS({ feedScanAngleRad: (v * Math.PI) / 180 })}
        />
      </Section>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section">
      <h3>{title}</h3>
      <div className="section-body">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="row">{children}</div>;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <label className="slider">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="number">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
