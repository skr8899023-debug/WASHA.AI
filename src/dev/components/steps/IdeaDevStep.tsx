import { useDevStudio } from "../../DevStudioContext";
import { promptQuality } from "../../../lib/prompt";
import { StepNav } from "./StepNav";

const IDEA_STARTERS = [
  "عبارة خط عربي: ",
  "رمز نخلة صحراوية ",
  "نمط هندسي متكرر ",
  "طائر محلّق بخطوط بسيطة ",
];

export function IdeaDevStep() {
  const { state, patch } = useDevStudio();
  const quality = promptQuality(state.rawIdea);
  const tooShort = state.rawIdea.trim().length > 0 && state.rawIdea.trim().length < 6;

  return (
    <section className="panel step-enter" aria-labelledby="idea-step-title">
      <h2 className="panel-title" id="idea-step-title">
        صف فكرتك
      </h2>
      <p className="panel-sub">اكتب الفكرة بالعربية. سنحسّنها معك قبل التوليد دون تغيير قصدك.</p>

      <div className="hint-chips" aria-label="بدايات مقترحة">
        {IDEA_STARTERS.map((s) => (
          <button
            key={s}
            className="hint-chip"
            onClick={() => patch({ rawIdea: state.rawIdea ? `${state.rawIdea} ${s}` : s, promptApproved: false, improvedPrompt: "" })}
          >
            {s.trim()}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="raw-idea">فكرة التصميم</label>
        <textarea
          id="raw-idea"
          value={state.rawIdea}
          placeholder="مثال: عبارة «صبر جميل» بخط عربي انسيابي مع هلال صغير"
          onChange={(e) => patch({ rawIdea: e.target.value, promptApproved: false, improvedPrompt: "" })}
        />
        {tooShort && <span className="field-error">الفكرة قصيرة جدًا، أضف بضع كلمات توضيحية.</span>}
        {!tooShort && <span className="field-hint">كلما زادت التفاصيل، كانت النتيجة أدق.</span>}
      </div>

      {state.rawIdea.trim().length > 0 && (
        <div className="quality-meter" aria-live="polite">
          <span className={`quality-pill ${quality.level}`}>{quality.label}</span>
          {quality.tips.length > 0 && (
            <span className="quality-tips">{quality.tips.join(" · ")}</span>
          )}
        </div>
      )}

      <StepNav />
    </section>
  );
}
