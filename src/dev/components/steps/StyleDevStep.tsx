import { STYLES } from "../../../lib/catalog";
import { useDevStudio } from "../../DevStudioContext";
import { StepNav } from "./StepNav";

export function StyleDevStep() {
  const { state, patch } = useDevStudio();

  return (
    <section className="panel step-enter" aria-labelledby="style-step-title">
      <h2 className="panel-title" id="style-step-title">
        اختر الأسلوب الفني
      </h2>
      <p className="panel-sub">الأسلوب يوجّه شكل العناصر وروح التصميم.</p>

      <div className="choice-grid" role="radiogroup" aria-label="الأسلوب الفني">
        {STYLES.map((s) => (
          <button
            key={s.id}
            role="radio"
            aria-checked={state.styleId === s.id}
            className={`choice-card ${state.styleId === s.id ? "selected" : ""}`}
            onClick={() => patch({ styleId: s.id, promptApproved: false, improvedPrompt: "" })}
          >
            <span className="choice-label">{s.label}</span>
            <span className="choice-hint">{s.hint}</span>
          </button>
        ))}
      </div>

      <StepNav />
    </section>
  );
}
