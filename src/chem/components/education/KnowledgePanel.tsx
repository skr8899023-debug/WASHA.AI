import { itemsById } from "../../data/chemistryItems";
import { experimentsById } from "../../data/experiments";
import { CATEGORY_LABELS, itemBadge } from "../../types";
import { useChemistryStore } from "../../state/useChemistryStore";

/** بطاقة المعرفة: كل ما يحتاجه الطالب عن العنصر المحدد */
export function KnowledgePanel() {
  const selectedId = useChemistryStore((s) => s.selectedId);
  const selectItem = useChemistryStore((s) => s.selectItem);
  const goToExperiment = useChemistryStore((s) => s.goToExperiment);

  if (!selectedId) return null;
  const item = itemsById[selectedId];
  if (!item) return null;

  const badge = itemBadge(item);

  return (
    <aside className="chem-knowledge" aria-label={`بطاقة ${item.arabicName}`}>
      <header className="chem-knowledge-head">
        <div className="chem-formula-badge">{badge}</div>
        <div>
          <h2>{item.arabicName}</h2>
          <span className="chem-en">{item.englishName}</span>
          <div>
            <span className="chem-cat-badge">{CATEGORY_LABELS[item.category]}</span>
          </div>
        </div>
        <button className="chem-close-btn" onClick={() => selectItem(null)} aria-label="إغلاق البطاقة">
          ✕
        </button>
      </header>

      <div className="chem-knowledge-body">
        <section className="chem-section">
          <div className="chem-section-title">🔍 ما هو؟</div>
          <p>{item.shortDescription}</p>
        </section>

        <section className="chem-section">
          <div className="chem-section-title emerald">⭐ لماذا هو مهم؟</div>
          <p>{item.importance}</p>
        </section>

        <section className="chem-section">
          <div className="chem-section-title">⚡ خصائص سريعة</div>
          <ul>
            {item.properties.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="chem-section">
          <div className="chem-section-title violet">🛠 مثال من الحياة</div>
          <ul>
            {item.commonUses.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </section>

        <section className="chem-section">
          <div className="chem-section-title amber">⚠ خطأ شائع</div>
          <div className="chem-callout warn">{item.misconception}</div>
        </section>

        <section className="chem-section">
          <div className="chem-section-title violet">💭 سؤال تفكير</div>
          <div className="chem-callout think">{item.thinkingQuestion}</div>
        </section>

        {item.relatedExperiments.length > 0 && (
          <section className="chem-section">
            <div className="chem-section-title">🧪 تجارب مرتبطة</div>
            <div>
              {item.relatedExperiments.map((expId) =>
                experimentsById[expId] ? (
                  <button key={expId} className="chem-exp-link" onClick={() => goToExperiment(expId)}>
                    ⚗ {experimentsById[expId].title}
                  </button>
                ) : null,
              )}
            </div>
          </section>
        )}

        <section className="chem-section">
          <div className="chem-section-title red">🥽 ملاحظات السلامة</div>
          <div className="chem-callout danger">{item.safetyNotes}</div>
        </section>

        <p className="chem-source-note">
          📚 {item.sourceNotes} — آخر مراجعة: {item.lastReviewed}
        </p>
      </div>
    </aside>
  );
}
