import { chemicals } from "../../data/chemicals";
import type { Chemical, ChemicalKind } from "../../types";

const KIND_LABELS: Record<ChemicalKind, string> = {
  acid: "حمض",
  base: "قاعدة",
  salt: "ملح",
  carbonate: "كربونات",
  metal: "فلز",
  indicator: "كاشف",
  water: "ماء",
  other: "مادة",
};

interface Props {
  contents: string[];
  full: boolean;
  onAdd: (id: string) => void;
}

/** رفّ المواد الكيميائية — انقر لتسكب المادة في الكأس */
export function ChemicalShelf({ contents, full, onAdd }: Props) {
  return (
    <aside className="rxn-shelf" aria-label="رفّ المواد">
      <div className="rxn-shelf-head">
        <b>رفّ المواد</b>
        <span>انقر المادة لتسكبها في الكأس</span>
      </div>
      <div className="rxn-shelf-list">
        {chemicals.map((c: Chemical) => {
          const inBeaker = contents.includes(c.id);
          const disabled = inBeaker || (full && !inBeaker);
          return (
            <button
              key={c.id}
              className={`rxn-chem-card ${inBeaker ? "in" : ""}`}
              disabled={disabled}
              onClick={() => onAdd(c.id)}
              aria-label={`اسكب ${c.arabicName}`}
            >
              <span className="rxn-chem-swatch" style={{ background: c.color }}>
                {c.icon}
              </span>
              <span className="rxn-chem-meta">
                <b>{c.arabicName}</b>
                <small>
                  <span className="rxn-kind">{KIND_LABELS[c.kind]}</span>
                  <span className="rxn-formula">{c.formula}</span>
                </small>
              </span>
              {inBeaker && <span className="rxn-chem-check">✓</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
