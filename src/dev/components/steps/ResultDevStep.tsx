import { useDevStudio } from "../../DevStudioContext";
import { PromptInspector } from "../PromptInspector";
import { ArabicEmptyState, ArabicErrorState, ArabicLoadingState } from "../ArabicStates";
import { StepNav } from "./StepNav";

export function ResultDevStep() {
  const { state, generate, saveCurrent, patch } = useDevStudio();

  const alreadySaved =
    state.current != null && state.history.some((h) => h.seed === state.current?.seed);

  return (
    <section className="panel step-enter" aria-labelledby="result-step-title">
      <h2 className="panel-title" id="result-step-title">
        مراجعة وتوليد
      </h2>
      <p className="panel-sub">راجع النص المحسّن واعتمده، ثم ولّد التصميم.</p>

      <PromptInspector />

      <div style={{ marginTop: 18 }}>
        {state.status === "idle" && (
          <ArabicEmptyState
            title="لا يوجد تصميم بعد"
            body={
              state.promptApproved
                ? "النص جاهز. اضغط «توليد التصميم» لرؤية النتيجة على القطعة."
                : "اعتمد النص المحسّن أولًا، أو ولّد مباشرة بالنص الأصلي."
            }
            actions={
              <button className="btn btn-primary" onClick={generate} disabled={!state.rawIdea.trim()}>
                توليد التصميم
              </button>
            }
          />
        )}

        {state.status === "loading" && <ArabicLoadingState label="جارٍ توليد التصميم…" />}

        {state.status === "error" && state.error && (
          <ArabicErrorState error={state.error} onRetry={generate} />
        )}

        {state.status === "success" && state.current && (
          <div className="step-nav" style={{ justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={saveCurrent} disabled={alreadySaved}>
              {alreadySaved ? "محفوظ في السجل" : "حفظ في السجل"}
            </button>
            <button className="btn" onClick={generate}>
              توليد نسخة جديدة
            </button>
            <button className="btn btn-ghost" onClick={() => patch({ compareOpen: !state.compareOpen })}>
              {state.compareOpen ? "إخفاء المقارنة" : "وضع المقارنة"}
            </button>
          </div>
        )}
      </div>

      <StepNav />
    </section>
  );
}
