import { useEffect } from "react";
import { JOURNEYS, JOURNEY_BY_ID } from "../../data/journeys";
import { BODY_BY_ID } from "../../data/celestialBodies";
import { useSpaceStore } from "../../state/useSpaceStore";

export function GuidedJourneyPanel() {
  const activeJourneyId = useSpaceStore((s) => s.activeJourneyId);
  const journeyStepIndex = useSpaceStore((s) => s.journeyStepIndex);
  const startJourney = useSpaceStore((s) => s.startJourney);
  const setJourneyStep = useSpaceStore((s) => s.setJourneyStep);
  const exitJourney = useSpaceStore((s) => s.exitJourney);
  const selectBody = useSpaceStore((s) => s.selectBody);
  const resetCamera = useSpaceStore((s) => s.resetCamera);

  const journey = activeJourneyId ? JOURNEY_BY_ID[activeJourneyId] : null;
  const step = journey?.steps[journeyStepIndex];

  // focus the camera on the current step's body
  useEffect(() => {
    if (step) selectBody(step.bodyId);
  }, [step, selectBody]);

  if (!journey) {
    return (
      <aside className="journey-panel" aria-label="الرحلات التعليمية">
        <h2 className="panel-title">الرحلات التعليمية</h2>
        <p className="panel-hint">اختر رحلة موجهة، وسننتقل معك من جرم إلى آخر خطوة بخطوة.</p>
        <div className="journey-list">
          {JOURNEYS.map((j) => (
            <button key={j.id} type="button" className="journey-card" onClick={() => startJourney(j.id)}>
              <span className="journey-card-title">{j.title}</span>
              <span className="journey-card-subtitle">{j.subtitle}</span>
              <span className="journey-card-steps">{j.steps.length} محطات</span>
            </button>
          ))}
        </div>
      </aside>
    );
  }

  const isFirst = journeyStepIndex === 0;
  const isLast = journeyStepIndex === journey.steps.length - 1;
  const stepBody = step ? BODY_BY_ID[step.bodyId] : null;

  return (
    <aside className="journey-panel active" aria-label={journey.title}>
      <header className="journey-header">
        <h2 className="panel-title">{journey.title}</h2>
        <button
          type="button"
          className="icon-btn"
          aria-label="إنهاء الرحلة"
          onClick={() => {
            exitJourney();
            resetCamera();
          }}
        >
          ✕
        </button>
      </header>

      <div className="journey-progress" role="list" aria-label="محطات الرحلة">
        {journey.steps.map((_, i) => (
          <button
            key={i}
            type="button"
            role="listitem"
            aria-label={`المحطة ${i + 1}`}
            className={`journey-dot${i === journeyStepIndex ? " current" : i < journeyStepIndex ? " done" : ""}`}
            onClick={() => setJourneyStep(i)}
          />
        ))}
      </div>

      {step && (
        <div className="journey-step">
          <div className="journey-step-body">{stepBody?.arabicName}</div>
          <h3 className="journey-step-title">{step.title}</h3>
          <p className="journey-step-text">{step.text}</p>
        </div>
      )}

      <div className="journey-nav">
        <button
          type="button"
          className="btn secondary"
          disabled={isFirst}
          onClick={() => setJourneyStep(journeyStepIndex - 1)}
        >
          السابق
        </button>
        {isLast ? (
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              exitJourney();
              resetCamera();
            }}
          >
            إنهاء الرحلة ✔
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={() => setJourneyStep(journeyStepIndex + 1)}>
            التالي
          </button>
        )}
      </div>
    </aside>
  );
}
