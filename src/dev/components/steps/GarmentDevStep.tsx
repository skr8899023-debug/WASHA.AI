import { GARMENTS, garmentById } from "../../../lib/catalog";
import { useDevStudio } from "../../DevStudioContext";
import { StepNav } from "./StepNav";

export function GarmentDevStep() {
  const { state, patch } = useDevStudio();
  const garment = garmentById(state.garmentId);

  return (
    <section className="panel step-enter" aria-labelledby="garment-step-title">
      <h2 className="panel-title" id="garment-step-title">
        اختر القطعة
      </h2>
      <p className="panel-sub">نوع القطعة ولونها يحددان قاعدة التصميم.</p>

      <div className="choice-grid" role="radiogroup" aria-label="نوع القطعة">
        {GARMENTS.map((g) => (
          <button
            key={g.id}
            role="radio"
            aria-checked={state.garmentId === g.id}
            className={`choice-card ${state.garmentId === g.id ? "selected" : ""}`}
            onClick={() =>
              patch({
                garmentId: g.id,
                colorId: g.colors[0]?.id ?? null,
                size: g.sizes[0] ?? null,
                promptApproved: false,
                improvedPrompt: "",
              })
            }
          >
            <span className="choice-label">{g.label}</span>
            <span className="choice-hint">
              {g.colors.length} ألوان{g.sizes.length ? ` · مقاسات ${g.sizes[0]}–${g.sizes[g.sizes.length - 1]}` : ""}
            </span>
          </button>
        ))}
      </div>

      {garment && (
        <>
          <div className="field" style={{ marginTop: 18 }}>
            <label>اللون</label>
            <div className="swatch-row" role="radiogroup" aria-label="لون القطعة">
              {garment.colors.map((c) => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={state.colorId === c.id}
                  title={c.label}
                  aria-label={c.label}
                  className={`swatch ${state.colorId === c.id ? "selected" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => patch({ colorId: c.id, promptApproved: false })}
                />
              ))}
            </div>
            <span className="field-hint">
              {garment.colors.find((c) => c.id === state.colorId)?.label ?? ""}
            </span>
          </div>

          {garment.sizes.length > 0 && (
            <div className="field">
              <label>المقاس</label>
              <div className="size-row" role="radiogroup" aria-label="المقاس">
                {garment.sizes.map((s) => (
                  <button
                    key={s}
                    role="radio"
                    aria-checked={state.size === s}
                    className={`size-chip ${state.size === s ? "selected" : ""}`}
                    onClick={() => patch({ size: s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <StepNav />
    </section>
  );
}
