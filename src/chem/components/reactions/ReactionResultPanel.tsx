import { OUTCOME_LABELS } from "../../types";
import type { ReactionResult } from "../../reactions/reactionEngine";

const PH_SCALE = ["#dc2626", "#ea580c", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#c026d3", "#d946ef"];

const OUTCOME_COLOR: Record<string, string> = {
  none: "#64778f",
  color: "#a78bfa",
  gas: "#22d3ee",
  precipitate: "#e2e8f0",
  phShift: "#f472b6",
  tempChange: "#fb923c",
  dissolution: "#38bdf8",
  crystallization: "#c7d2fe",
  neutralization: "#34d399",
  evaporation: "#7dd3fc",
  physical: "#fbbf24",
};

/** لوحة النتيجة: تشرح ماذا حدث ولماذا بست زوايا */
export function ReactionResultPanel({ result }: { result: ReactionResult }) {
  const { outcome, title, explanation, visual, conceptualOnly } = result;
  const accent = OUTCOME_COLOR[outcome] ?? "#22d3ee";
  const ph = visual.phValue;

  const rows: { icon: string; label: string; value: string; cls?: string }[] = [
    { icon: "🔎", label: "ماذا حدث؟", value: explanation.what },
    { icon: "🧠", label: "لماذا حدث؟", value: explanation.why },
    { icon: "🏷", label: "نوع التفاعل؟", value: explanation.type },
    { icon: "👁", label: "الدليل المرئي؟", value: explanation.evidence },
    { icon: "🧮", label: "المعادلة المبسّطة؟", value: explanation.equation, cls: "ltr" },
    { icon: "🥽", label: "ملاحظة السلامة؟", value: explanation.safety, cls: "safety" },
  ];

  return (
    <section className="rxn-result" aria-live="polite">
      <header className="rxn-result-head" style={{ "--accent": accent } as React.CSSProperties}>
        <div>
          <span className="rxn-outcome-badge" style={{ color: accent, borderColor: accent }}>
            {OUTCOME_LABELS[outcome]}
          </span>
          {conceptualOnly && <span className="rxn-concept-badge">عرض تعليمي فقط</span>}
          <h3>{title}</h3>
        </div>
      </header>

      {ph !== undefined && (
        <div className="rxn-ph">
          <div className="rxn-ph-bar">
            {PH_SCALE.map((c, i) => (
              <span key={i} style={{ background: c, opacity: i === Math.round((ph / 14) * 14) ? 1 : 0.32 }} />
            ))}
          </div>
          <div className="rxn-ph-label">
            الرقم الهيدروجيني ≈ <b>{ph}</b> — {ph < 7 ? "حمضي" : ph > 7 ? "قاعدي" : "متعادل"}
          </div>
        </div>
      )}

      <div className="rxn-result-body">
        {rows.map((r) => (
          <div key={r.label} className={`rxn-result-row ${r.cls ?? ""}`}>
            <div className="rxn-result-label">
              <span>{r.icon}</span> {r.label}
            </div>
            <p>{r.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
