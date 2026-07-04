import { PROVIDERS } from "../../lib/generation";
import { useDevStudio } from "../DevStudioContext";

export function ProviderStatusPanel() {
  const { state } = useDevStudio();

  const stateFor = (index: number): { cls: string; label: string } => {
    const active = index === state.providerIndex;
    if (active && state.status === "loading") return { cls: "busy", label: "يعمل الآن…" };
    if (active && state.error?.code === "busy") return { cls: "down", label: "مشغول" };
    if (active && state.error?.code === "quota") return { cls: "down", label: "حد الاستخدام" };
    if (active) return { cls: "ok", label: "جاهز" };
    return { cls: "ok", label: "احتياطي" };
  };

  return (
    <section className="panel" aria-labelledby="provider-title">
      <h3 className="panel-title" id="provider-title" style={{ fontSize: 14 }}>
        حالة مزوّدي التوليد
      </h3>
      {PROVIDERS.map((p, i) => {
        const s = stateFor(i);
        return (
          <div className="provider-row" key={p}>
            <span className={`provider-dot ${s.cls}`} aria-hidden />
            <span className="provider-name">{p}</span>
            <span className="spacer" />
            <span className="provider-state">{s.label}</span>
          </div>
        );
      })}
      {state.lastDuration != null && (
        <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 8 }}>
          آخر توليد استغرق {(state.lastDuration / 1000).toFixed(1)} ثانية.
        </p>
      )}
    </section>
  );
}
