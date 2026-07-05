import { useSpaceStore } from "../../state/useSpaceStore";
import type { AppMode } from "../../utils/astronomyTypes";

const MODES: { id: AppMode; label: string; icon: string }[] = [
  { id: "explore", label: "استكشف", icon: "🪐" },
  { id: "learn", label: "تعلّم", icon: "🧭" },
  { id: "quiz", label: "اختبر نفسك", icon: "✍" },
];

export function ModeSwitcher() {
  const mode = useSpaceStore((s) => s.mode);
  const setMode = useSpaceStore((s) => s.setMode);

  return (
    <nav className="mode-switcher" aria-label="أوضاع التعلم">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`mode-btn${mode === m.id ? " active" : ""}`}
          aria-pressed={mode === m.id}
          onClick={() => setMode(m.id)}
        >
          <span aria-hidden>{m.icon}</span> {m.label}
        </button>
      ))}
    </nav>
  );
}
