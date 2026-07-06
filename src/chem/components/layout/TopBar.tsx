import type { Mode } from "../../types";
import { useChemistryStore } from "../../state/useChemistryStore";

const MODES: { key: Mode; label: string }[] = [
  { key: "explore", label: "🔬 استكشف" },
  { key: "learn", label: "🧭 تعلّم" },
  { key: "experiments", label: "⚗ التجارب" },
  { key: "reactions", label: "🧪 التفاعلات" },
  { key: "quiz", label: "📝 اختبر نفسك" },
  { key: "compare", label: "⚖ قارن" },
  { key: "safety", label: "🥽 السلامة" },
];

export function TopBar() {
  const mode = useChemistryStore((s) => s.mode);
  const setMode = useChemistryStore((s) => s.setMode);
  const labelsVisible = useChemistryStore((s) => s.labelsVisible);
  const toggleLabels = useChemistryStore((s) => s.toggleLabels);
  const resetView = useChemistryStore((s) => s.resetView);

  return (
    <header className="chem-topbar">
      <div className="chem-brand">
        <div className="chem-brand-icon">⚗</div>
        <div>
          <h1>مختبر الكيمياء التفاعلي</h1>
          <small>رحلة ثلاثية الأبعاد في عالم الذرات والجزيئات</small>
        </div>
      </div>

      <nav className="chem-modes" aria-label="أوضاع التعلم">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`chem-mode-btn ${mode === m.key ? "active" : ""}`}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </nav>

      {mode === "explore" ? (
        <div className="chem-topbar-actions">
          <button className={`chem-ghost-btn ${labelsVisible ? "on" : ""}`} onClick={toggleLabels}>
            {labelsVisible ? "🏷 التسميات: تعمل" : "🏷 التسميات: متوقفة"}
          </button>
          <button className="chem-ghost-btn" onClick={resetView}>
            🎥 إعادة ضبط العرض
          </button>
        </div>
      ) : (
        <div className="chem-topbar-actions" />
      )}
    </header>
  );
}
