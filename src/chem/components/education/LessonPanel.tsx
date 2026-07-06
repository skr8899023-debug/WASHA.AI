import { useState } from "react";
import { journeysById, learningJourneys } from "../../data/learningJourneys";
import { itemsById } from "../../data/chemistryItems";
import { useChemistryStore } from "../../state/useChemistryStore";

function JourneyList() {
  const openJourney = useChemistryStore((s) => s.openJourney);
  return (
    <>
      <div className="chem-page-head">
        <h2>🧭 رحلات تعلّم موجّهة</h2>
        <p>اختر رحلة قصيرة تأخذك خطوة بخطوة عبر أهم أفكار الكيمياء، مع روابط مباشرة إلى المختبر ثلاثي الأبعاد.</p>
      </div>
      <div className="chem-grid">
        {learningJourneys.map((j) => (
          <button
            key={j.id}
            className="chem-card"
            style={{ "--card-accent": j.color } as React.CSSProperties}
            onClick={() => openJourney(j.id)}
          >
            <div className="chem-card-icon" style={{ color: j.color }}>{j.icon}</div>
            <h3>{j.title}</h3>
            <p>{j.subtitle}</p>
            <div className="chem-card-meta">{j.steps.length} خطوات</div>
          </button>
        ))}
      </div>
    </>
  );
}

function JourneyViewer({ journeyId }: { journeyId: string }) {
  const [step, setStep] = useState(0);
  const openJourney = useChemistryStore((s) => s.openJourney);
  const focusInLab = useChemistryStore((s) => s.focusInLab);

  const journey = journeysById[journeyId];
  const current = journey.steps[step];
  const related = current.relatedItemId ? itemsById[current.relatedItemId] : null;

  return (
    <div className="chem-lesson">
      <div className="chem-lesson-head">
        <div className="chem-card-icon" style={{ color: journey.color, marginBottom: 0 }}>{journey.icon}</div>
        <div>
          <h3>{journey.title}</h3>
          <small>{journey.subtitle}</small>
        </div>
        <button className="chem-close-btn" style={{ marginInlineStart: "auto" }} onClick={() => openJourney(null)} aria-label="العودة لقائمة الرحلات">
          ✕
        </button>
      </div>
      <div className="chem-progress-track">
        <div className="chem-progress-fill" style={{ width: `${((step + 1) / journey.steps.length) * 100}%` }} />
      </div>
      <div className="chem-lesson-body">
        <h4>{current.title}</h4>
        <p>{current.body}</p>
        {current.tip && <div className="chem-callout think chem-lesson-tip">💡 {current.tip}</div>}
        {related && (
          <button className="chem-inline-link" onClick={() => focusInLab(related.id)}>
            🔬 شاهد «{related.arabicName}» في المختبر
          </button>
        )}
      </div>
      <div className="chem-lesson-actions">
        <button className="chem-btn primary" disabled={step >= journey.steps.length - 1} onClick={() => setStep(step + 1)}>
          الخطوة التالية ←
        </button>
        <button className="chem-btn secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
          → السابقة
        </button>
        {step === journey.steps.length - 1 && (
          <button className="chem-btn secondary" onClick={() => openJourney(null)}>
            ✔ أنهيت الرحلة
          </button>
        )}
        <span className="chem-step-count">
          {step + 1} / {journey.steps.length}
        </span>
      </div>
    </div>
  );
}

export function LessonPanel() {
  const activeJourneyId = useChemistryStore((s) => s.activeJourneyId);
  return (
    <div className="chem-page">
      {activeJourneyId ? <JourneyViewer key={activeJourneyId} journeyId={activeJourneyId} /> : <JourneyList />}
    </div>
  );
}
