import { PALETTES } from "../../../lib/catalog";
import { useDevStudio } from "../../DevStudioContext";
import { StepNav } from "./StepNav";

export function PaletteDevStep() {
  const { state, patch } = useDevStudio();

  return (
    <section className="panel step-enter" aria-labelledby="palette-step-title">
      <h2 className="panel-title" id="palette-step-title">
        اختر لوحة الألوان
      </h2>
      <p className="panel-sub">لوحة الألوان تضبط انسجام التصميم مع لون القطعة.</p>

      <div className="choice-grid" role="radiogroup" aria-label="لوحة الألوان">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={state.paletteId === p.id}
            className={`choice-card ${state.paletteId === p.id ? "selected" : ""}`}
            onClick={() => patch({ paletteId: p.id, promptApproved: false, improvedPrompt: "" })}
          >
            <span className="palette-strip" aria-hidden>
              {p.colors.map((c) => (
                <span key={c} style={{ background: c }} />
              ))}
            </span>
            <span className="choice-label">{p.label}</span>
            <span className="choice-hint">{p.promptFragment}</span>
          </button>
        ))}
      </div>

      <StepNav nextLabel="مراجعة وتوليد" />
    </section>
  );
}
