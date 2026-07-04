import { useState } from "react";
import { GARMENTS, PALETTES, POSITIONS, STYLES, garmentById, colorById } from "../lib/catalog";
import { GenerationError, errorInfo, generateDesign, hashSeed } from "../lib/generation";
import { Mockup } from "../components/Mockup";
import type { GenerationErrorInfo, GenerationStatus } from "../lib/types";

/**
 * Production studio (/design/washa-ai/app): the stable, simpler flow.
 * The dev studio (/design/washa-ai/dev) iterates on top of the same
 * catalog + generation contracts without touching this screen.
 */
export function WashaProductionStudio() {
  const [garmentId, setGarmentId] = useState(GARMENTS[0].id);
  const [colorId, setColorId] = useState(GARMENTS[0].colors[0].id);
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [error, setError] = useState<GenerationErrorInfo | null>(null);
  const [seed, setSeed] = useState<number | null>(null);
  const [variant, setVariant] = useState(0);

  const garment = garmentById(garmentId)!;
  const color = colorById(garment, colorId) ?? garment.colors[0];

  const generate = async () => {
    if (!idea.trim() || status === "loading") return;
    setStatus("loading");
    setError(null);
    const v = variant + 1;
    setVariant(v);
    try {
      const result = await generateDesign({
        prompt: idea,
        variant: v,
        failureMode: "none",
        providerIndex: 0,
      });
      setSeed(result.seed);
      setStatus("success");
    } catch (err) {
      console.error("[washa] generation failed", err);
      setError(err instanceof GenerationError ? err.info : errorInfo("unknown"));
      setStatus("error");
    }
  };

  return (
    <div className="studio-shell">
      <header className="dev-header">
        <div className="brand">
          <strong>وَشى</strong>
        </div>
        <div className="spacer" />
        <a className="btn btn-sm btn-ghost" href="/design/washa-ai/dev">
          مختبر التطوير
        </a>
      </header>

      <main className="prod-hero">
        <h1>صمّم قطعتك</h1>
        <p className="lead">اختر القطعة، صف فكرتك، وولّد التصميم.</p>

        <section className="panel">
          <div className="field">
            <label>القطعة</label>
            <div className="size-row">
              {GARMENTS.map((g) => (
                <button
                  key={g.id}
                  className={`size-chip ${garmentId === g.id ? "selected" : ""}`}
                  style={{ padding: "4px 14px" }}
                  onClick={() => {
                    setGarmentId(g.id);
                    setColorId(g.colors[0].id);
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>اللون</label>
            <div className="swatch-row">
              {garment.colors.map((c) => (
                <button
                  key={c.id}
                  title={c.label}
                  aria-label={c.label}
                  className={`swatch ${colorId === c.id ? "selected" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => setColorId(c.id)}
                />
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="prod-idea">فكرة التصميم</label>
            <textarea
              id="prod-idea"
              value={idea}
              placeholder="اكتب فكرتك بالعربية…"
              onChange={(e) => setIdea(e.target.value)}
            />
          </div>

          <div className="step-nav">
            <button className="btn btn-primary" onClick={generate} disabled={!idea.trim() || status === "loading"}>
              {status === "loading" ? "جارٍ التوليد…" : "توليد التصميم"}
            </button>
          </div>

          {status === "error" && error && (
            <p className="field-error" role="alert" style={{ marginTop: 10 }}>
              {error.message} {error.action}
            </p>
          )}

          {status === "success" && seed != null && (
            <div className="mockup-frame mockup-swap" style={{ marginTop: 16, maxWidth: 420 }}>
              <Mockup
                garmentId={garment.id}
                color={color}
                position={POSITIONS[0]}
                palette={PALETTES[hashSeed(idea) % PALETTES.length]}
                styleId={STYLES[hashSeed(idea, 7) % STYLES.length].id}
                seed={seed}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
