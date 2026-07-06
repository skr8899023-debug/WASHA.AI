import { useMemo, useState } from "react";
import { chemistryItems } from "../../data/chemistryItems";
import type { Category } from "../../types";
import { CATEGORY_LABELS } from "../../types";
import { useChemistryStore } from "../../state/useChemistryStore";

const FILTERS: { key: Category | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "concept", label: "مفاهيم" },
  { key: "element", label: "عناصر" },
  { key: "compound", label: "مركبات" },
  { key: "tool", label: "أدوات" },
];

/** قائمة جانبية لتصفح كل عناصر المحتوى بما فيها المفاهيم غير المجسّدة في المشهد */
export function ItemBrowser() {
  const [filter, setFilter] = useState<Category | "all">("all");
  const selectedId = useChemistryStore((s) => s.selectedId);
  const selectItem = useChemistryStore((s) => s.selectItem);

  const items = useMemo(
    () => (filter === "all" ? chemistryItems : chemistryItems.filter((i) => i.category === filter)),
    [filter],
  );

  return (
    <nav className="chem-browser" aria-label="تصفح المحتوى">
      <div className="chem-browser-head">دليل المختبر</div>
      <div className="chem-browser-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chem-chip ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="chem-browser-list">
        {items.map((item) => (
          <button
            key={item.id}
            className={`chem-browser-item ${selectedId === item.id ? "active" : ""}`}
            onClick={() => selectItem(item.id)}
          >
            <span className="chem-item-dot" style={{ color: item.visual.kind === "concept" ? item.visual.color : undefined }}>
              {item.visual.kind === "concept" ? item.visual.icon : (item.symbolOrFormula ?? "⚙")}
            </span>
            <span>
              <b>{item.arabicName}</b>
              <small>{CATEGORY_LABELS[item.category]} • {item.englishName}</small>
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
