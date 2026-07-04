import { useDevStudio } from "../../DevStudioContext";

/** Shared prev/next footer for the flow steps. */
export function StepNav({ nextLabel }: { nextLabel?: string }) {
  const { state, goToStep, stepReady } = useDevStudio();
  const canNext = stepReady(state.step) && state.step < 5;

  return (
    <div className="step-nav">
      {state.step > 0 && (
        <button className="btn btn-ghost" onClick={() => goToStep(state.step - 1)}>
          السابق
        </button>
      )}
      <span className="grow" />
      {state.step < 5 && (
        <button className="btn btn-primary" disabled={!canNext} onClick={() => goToStep(state.step + 1)}>
          {nextLabel ?? "التالي"}
        </button>
      )}
    </div>
  );
}
