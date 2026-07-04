import { useState } from "react";
import { useDevStudio } from "../DevStudioContext";
import { promptQuality } from "../../lib/prompt";

/**
 * Shows النص الأصلي / النص المحسّن side by side. The improved prompt is
 * generated on demand, never silently overwrites the user's idea, and can
 * be edited before approval.
 */
export function PromptInspector() {
  const { state, patch, buildImprovedPrompt } = useDevStudio();
  const [editing, setEditing] = useState(false);
  const quality = promptQuality(state.rawIdea);

  const handleImprove = () => {
    const improved = buildImprovedPrompt();
    if (improved) {
      patch({ improvedPrompt: improved, promptApproved: false });
      setEditing(false);
    }
  };

  return (
    <div>
      <div className="quality-meter">
        <span className={`quality-pill ${quality.level}`}>{quality.label}</span>
        {!state.improvedPrompt && (
          <button className="btn btn-sm btn-primary" onClick={handleImprove} disabled={!state.rawIdea.trim()}>
            تحسين الوصف
          </button>
        )}
      </div>

      <div className="prompt-compare">
        <div className="prompt-box">
          <h4>النص الأصلي</h4>
          <p>{state.rawIdea.trim() || "—"}</p>
        </div>

        <div className="prompt-box improved">
          <h4>النص المحسّن</h4>
          {!state.improvedPrompt ? (
            <p style={{ color: "var(--text-soft)" }}>
              اضغط «تحسين الوصف» لبناء نص جاهز للطباعة يشمل القطعة والموضع والأسلوب والألوان.
            </p>
          ) : editing ? (
            <textarea
              aria-label="تعديل النص المحسّن"
              value={state.improvedPrompt}
              onChange={(e) => patch({ improvedPrompt: e.target.value, promptApproved: false })}
            />
          ) : (
            <pre>{state.improvedPrompt}</pre>
          )}

          {state.improvedPrompt && (
            <div className="step-nav" style={{ marginTop: 10 }}>
              {editing ? (
                <button className="btn btn-sm btn-primary" onClick={() => setEditing(false)}>
                  حفظ التعديل
                </button>
              ) : (
                <>
                  {!state.promptApproved && (
                    <button className="btn btn-sm btn-primary" onClick={() => patch({ promptApproved: true })}>
                      اعتماد النص
                    </button>
                  )}
                  {state.promptApproved && (
                    <span className="quality-pill ready" style={{ alignSelf: "center" }}>
                      تم الاعتماد
                    </span>
                  )}
                  <button className="btn btn-sm" onClick={() => setEditing(true)}>
                    تعديل
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={handleImprove}>
                    إعادة التحسين
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
