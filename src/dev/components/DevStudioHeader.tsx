import { useDevStudio } from "../DevStudioContext";

export function DevStudioHeader() {
  const { state, patch } = useDevStudio();

  return (
    <header className="dev-header">
      <div className="brand">
        <strong>وَشى</strong>
        <span className="dev-badge">مختبر التطوير</span>
      </div>
      <div className="spacer" />
      <div className="actions">
        <button
          className="btn btn-sm"
          onClick={() => patch({ historyOpen: !state.historyOpen })}
          aria-expanded={state.historyOpen}
        >
          السجل ({state.history.length})
        </button>
        <a className="btn btn-sm btn-ghost" href="/design/washa-ai/app">
          العودة للنسخة الحالية
        </a>
      </div>
    </header>
  );
}
