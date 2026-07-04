import { STEP_LABELS, useDevStudio } from "../DevStudioContext";

export function DevStepper() {
  const { state, goToStep, stepReady } = useDevStudio();

  const reachable = (index: number) => {
    for (let i = 0; i < index; i++) {
      if (!stepReady(i)) return false;
    }
    return true;
  };

  return (
    <nav aria-label="خطوات التصميم">
      <div className="stepper" role="tablist">
        {STEP_LABELS.map((label, i) => {
          const active = state.step === i;
          const done = i < state.step && stepReady(i);
          return (
            <button
              key={label}
              role="tab"
              aria-selected={active}
              aria-current={active ? "step" : undefined}
              className={`stepper-item ${active ? "active" : ""} ${done ? "done" : ""}`}
              disabled={!reachable(i)}
              onClick={() => goToStep(i)}
            >
              <span className="step-dot">{done ? "✓" : i + 1}</span>
              <span className="step-label">{label}</span>
            </button>
          );
        })}
      </div>
      <div className="stepper-progress" aria-hidden>
        <div style={{ transform: `scaleX(${(state.step + 1) / STEP_LABELS.length})` }} />
      </div>
    </nav>
  );
}
