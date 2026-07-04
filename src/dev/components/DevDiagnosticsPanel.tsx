import { useState } from "react";
import { useDevStudio } from "../DevStudioContext";
import { PROVIDERS } from "../../lib/generation";
import type { FailureMode } from "../../lib/types";

// Developer-facing panel: English + monospace on purpose (internal tooling,
// exempt from the Arabic-only rule for customer copy).
export function DevDiagnosticsPanel() {
  const { state, patch } = useDevStudio();
  const [open, setOpen] = useState(false);

  const rows: Array<[string, string]> = [
    ["step", `${state.step + 1} / 6`],
    ["garment", state.garmentId ?? "—"],
    ["color", state.colorId ?? "—"],
    ["size", state.size ?? "—"],
    ["position", state.positionId ?? "—"],
    ["style", state.styleId ?? "—"],
    ["palette", state.paletteId ?? "—"],
    ["prompt.len", String(state.rawIdea.trim().length)],
    ["improved.len", String(state.improvedPrompt.trim().length)],
    ["provider", PROVIDERS[state.providerIndex]],
    ["status", state.status],
    ["gen.duration", state.lastDuration != null ? `${state.lastDuration}ms` : "—"],
    ["last.error", state.lastError ?? "—"],
    ["history.count", String(state.history.length)],
    ["seed", state.current ? String(state.current.seed) : "—"],
  ];

  return (
    <div className="diagnostics">
      <button className="diag-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span aria-hidden>{open ? "▾" : "▸"}</span> diagnostics
      </button>
      {open && (
        <div className="diag-body">
          {rows.map(([k, v]) => (
            <div className="diag-row" key={k}>
              <span className="diag-key">{k}</span>
              <span className="diag-val">{v}</span>
            </div>
          ))}
          <div className="diag-row" style={{ alignItems: "center", marginTop: 6 }}>
            <span className="diag-key">failure.mode</span>
            <select
              value={state.failureMode}
              onChange={(e) => patch({ failureMode: e.target.value as FailureMode })}
            >
              <option value="none">none</option>
              <option value="random">random (35%)</option>
              <option value="quota">force: quota</option>
              <option value="busy">force: busy</option>
              <option value="payload">force: payload</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
