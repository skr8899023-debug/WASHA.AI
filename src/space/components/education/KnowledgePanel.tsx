import { useMemo } from "react";
import { BODY_BY_ID } from "../../data/celestialBodies";
import { CATEGORY_LABELS } from "../../utils/astronomyTypes";
import { useSpaceStore } from "../../state/useSpaceStore";
import { formatArabicCompact, formatArabicNumber, formatDaysArabic, formatHoursArabic } from "../../utils/formatArabicNumber";
import { SourceBadge } from "./SourceBadge";
import { QuizInline } from "./QuizInline";

export function KnowledgePanel() {
  const selectedBodyId = useSpaceStore((s) => s.selectedBodyId);
  const selectBody = useSpaceStore((s) => s.selectBody);
  const resetCamera = useSpaceStore((s) => s.resetCamera);
  const setCompareOpen = useSpaceStore((s) => s.setCompareOpen);
  const setCompare = useSpaceStore((s) => s.setCompare);

  const body = selectedBodyId ? BODY_BY_ID[selectedBodyId] : null;

  const metricRows = useMemo(() => {
    if (!body?.metrics) return [];
    const m = body.metrics;
    const rows: { label: string; value: string }[] = [];
    if (m.diameterKm !== undefined) {
      rows.push({
        label: "القطر",
        value:
          m.diameterKm >= 1
            ? `${formatArabicCompact(m.diameterKm)} كم`
            : `${formatArabicNumber(m.diameterKm * 1000)} متر تقريبًا`,
      });
    }
    if (m.distanceFromSunAU !== undefined && m.distanceFromSunAU > 0) {
      rows.push({ label: "البعد عن الشمس", value: `${formatArabicNumber(m.distanceFromSunAU)} وحدة فلكية` });
    }
    if (m.dayLengthHours !== undefined) {
      rows.push({ label: "مدة الدوران حول المحور", value: formatHoursArabic(m.dayLengthHours) });
    }
    if (m.yearLengthDays !== undefined) {
      rows.push({ label: "مدة الدورة حول الشمس", value: formatDaysArabic(m.yearLengthDays) });
    }
    if (m.moonCount !== undefined) {
      rows.push({
        label: "الأقمار",
        value: m.moonCount === "variable" ? m.moonCountNote ?? "يتغير الرقم مع الاكتشافات الجديدة" : formatArabicNumber(m.moonCount),
      });
    }
    if (m.tempNote) rows.push({ label: "الحرارة", value: m.tempNote });
    if (m.surfaceNote) rows.push({ label: "السطح / الطبيعة", value: m.surfaceNote });
    return rows;
  }, [body]);

  if (!body) return null;

  return (
    <aside className="knowledge-panel" aria-label={`بطاقة ${body.arabicName}`}>
      <header className="kp-header">
        <div>
          <div className="kp-chips">
            <span className="chip category">{CATEGORY_LABELS[body.category]}</span>
            <span className="chip difficulty">{body.difficulty}</span>
          </div>
          <h2 className="kp-title">{body.arabicName}</h2>
          <div className="kp-subtitle">{body.englishName}</div>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="إغلاق البطاقة"
          onClick={() => {
            selectBody(null);
            resetCamera();
          }}
        >
          ✕
        </button>
      </header>

      <div className="kp-scroll">
        <section className="kp-section">
          <h3>ما هو؟</h3>
          <p>{body.shortDescription}</p>
        </section>

        <section className="kp-section">
          <h3>لماذا هو مهم؟</h3>
          <p>{body.importance}</p>
        </section>

        <section className="kp-section">
          <h3>أرقام سريعة</h3>
          <ul className="kp-facts">
            {body.quickFacts.map((fact, i) => (
              <li key={i}>{fact}</li>
            ))}
          </ul>
          {metricRows.length > 0 && (
            <div className="kp-metrics">
              {metricRows.map((row) => (
                <div className="kp-metric" key={row.label}>
                  <span className="kp-metric-label">{row.label}</span>
                  <span className="kp-metric-value">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {body.misconception && (
          <section className="kp-section misconception">
            <h3>مقارنة ذكية: صحّح المفهوم</h3>
            <p className="wrong-idea">✗ {body.misconception.wrong}</p>
            <p className="correct-idea">✓ {body.misconception.correct}</p>
          </section>
        )}

        <section className="kp-section thinking">
          <h3>سؤال تفكير</h3>
          <p>{body.thinkingQuestion}</p>
        </section>

        {body.quiz.length > 0 && (
          <section className="kp-section">
            <h3>تجربة تفاعلية</h3>
            <QuizInline question={body.quiz[0]} />
          </section>
        )}

        <section className="kp-section">
          <h3>مصدر وملاحظة علمية</h3>
          <SourceBadge sourceNotes={body.sourceNotes} lastReviewed={body.lastReviewed} />
        </section>

        <div className="kp-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setCompare("a", body.id);
              setCompareOpen(true);
            }}
          >
            ⚖ قارن هذا الجرم
          </button>
        </div>
      </div>
    </aside>
  );
}
