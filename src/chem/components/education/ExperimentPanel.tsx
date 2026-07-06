import { useState } from "react";
import { experiments, experimentsById } from "../../data/experiments";
import { useChemistryStore } from "../../state/useChemistryStore";
import { ExperimentStage } from "./ExperimentStage";

function ExperimentList() {
  const openExperiment = useChemistryStore((s) => s.openExperiment);
  return (
    <>
      <div className="chem-page-head">
        <h2>⚗ التجارب التفاعلية</h2>
        <p>محاكاة تعليمية آمنة: نفّذ كل تجربة خطوة بخطوة وافهم ما يحدث للجسيمات في كل مرحلة.</p>
      </div>
      <div className="chem-grid">
        {experiments.map((exp) => (
          <button
            key={exp.id}
            className="chem-card"
            style={{ "--card-accent": "#a78bfa" } as React.CSSProperties}
            onClick={() => openExperiment(exp.id)}
          >
            <div className="chem-card-icon">🧪</div>
            <h3>{exp.title}</h3>
            <p>{exp.subtitle}</p>
            <div className="chem-card-meta">{exp.steps.length} خطوات • محاكاة آمنة</div>
          </button>
        ))}
      </div>
    </>
  );
}

function ExperimentRunner({ experimentId }: { experimentId: string }) {
  const [step, setStep] = useState(0);
  const openExperiment = useChemistryStore((s) => s.openExperiment);
  const exp = experimentsById[experimentId];
  const isLast = step === exp.steps.length - 1;
  const current = exp.steps[step];

  return (
    <>
      <div className="chem-page-head">
        <h2>🧪 {exp.title}</h2>
        <p style={{ direction: "ltr", textAlign: "end", fontWeight: 700, color: "#7dd3fc" }}>{exp.subtitle}</p>
      </div>
      <div className="chem-exp-layout">
        <div className="chem-stage-card">
          <ExperimentStage stage={current.stage} />
          <div className="chem-step-dots">
            {exp.steps.map((_, i) => (
              <span key={i} className={`chem-step-dot ${i === step ? "active" : i < step ? "done" : ""}`} />
            ))}
          </div>
        </div>
        <div className="chem-exp-side">
          <div className="chem-exp-info">
            <h4>🎯 الهدف</h4>
            <p>{exp.goal}</p>
          </div>
          <div className="chem-exp-info">
            <h4>
              الخطوة {step + 1}: {current.title}
            </h4>
            <p>{current.description}</p>
          </div>
          {isLast && (
            <div className="chem-exp-info" style={{ borderColor: "rgba(52,211,153,0.35)" }}>
              <h4 style={{ color: "#34d399" }}>✔ الخلاصة</h4>
              <p>{exp.conclusion}</p>
            </div>
          )}
          <div className="chem-callout danger">🥽 {exp.safety}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!isLast ? (
              <button className="chem-btn primary" onClick={() => setStep(step + 1)}>
                الخطوة التالية ←
              </button>
            ) : (
              <button className="chem-btn primary" onClick={() => setStep(0)}>
                ↺ أعد التجربة
              </button>
            )}
            <button className="chem-btn secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
              → السابقة
            </button>
            <button className="chem-btn secondary" onClick={() => openExperiment(null)}>
              كل التجارب
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function ExperimentPanel() {
  const activeExperimentId = useChemistryStore((s) => s.activeExperimentId);
  return (
    <div className="chem-page">
      {activeExperimentId ? (
        <ExperimentRunner key={activeExperimentId} experimentId={activeExperimentId} />
      ) : (
        <ExperimentList />
      )}
    </div>
  );
}
