import { POSITIONS } from "../../../lib/catalog";
import { useDevStudio } from "../../DevStudioContext";
import { StepNav } from "./StepNav";

// miniature garment diagram highlighting each print zone
function ZoneThumb({ zone }: { zone: string }) {
  const zones: Record<string, { x: number; y: number; w: number; h: number }> = {
    "chest-full": { x: 21, y: 22, w: 18, h: 20 },
    "chest-left": { x: 32, y: 21, w: 8, h: 8 },
    "back-full": { x: 20, y: 20, w: 20, h: 25 },
    sleeve: { x: 7, y: 21, w: 5, h: 9 },
  };
  const z = zones[zone];
  return (
    <svg viewBox="0 0 60 60" width="52" height="52" aria-hidden>
      <path d="M19 15 L8 20 L11 32 L18 29 L18 50 Q30 53 42 50 L42 29 L49 32 L52 20 L41 15 Q35 19 25 19 Q21 18 19 15 Z"
        fill="var(--surface-2)" stroke="var(--border-strong)" strokeWidth="1.2" />
      <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="1.5" fill="var(--accent)" opacity="0.55" />
    </svg>
  );
}

export function PositionDevStep() {
  const { state, patch } = useDevStudio();

  return (
    <section className="panel step-enter" aria-labelledby="position-step-title">
      <h2 className="panel-title" id="position-step-title">
        حدد موضع الطباعة
      </h2>
      <p className="panel-sub">الموضع يحدد مساحة التصميم وحجم التفاصيل الممكنة.</p>

      <div className="choice-grid" role="radiogroup" aria-label="موضع الطباعة">
        {POSITIONS.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={state.positionId === p.id}
            className={`choice-card ${state.positionId === p.id ? "selected" : ""}`}
            onClick={() => patch({ positionId: p.id, promptApproved: false, improvedPrompt: "" })}
          >
            <ZoneThumb zone={p.id} />
            <span className="choice-label">{p.label}</span>
            <span className="choice-hint">{p.hint}</span>
          </button>
        ))}
      </div>

      <StepNav />
    </section>
  );
}
