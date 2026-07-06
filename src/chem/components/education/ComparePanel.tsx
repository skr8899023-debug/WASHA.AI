import { Fragment, useState } from "react";
import { chemistryItems, itemsById } from "../../data/chemistryItems";
import { CATEGORY_LABELS } from "../../types";

const PRESETS: { label: string; a: string; b: string }[] = [
  { label: "عنصر ⇄ مركب", a: "element", b: "compound" },
  { label: "ذرة ⇄ جزيء", a: "atom", b: "molecule" },
  { label: "حمض ⇄ قاعدة", a: "acid", b: "base" },
  { label: "مخلوط ⇄ محلول", a: "mixture", b: "solution" },
  { label: "صوديوم ⇄ كلور", a: "sodium", b: "chlorine" },
  { label: "أكسجين ⇄ ثاني أكسيد الكربون", a: "oxygen", b: "co2" },
  { label: "تغير فيزيائي ⇄ كيميائي", a: "physical-change", b: "chemical-change" },
];

function Cell({ children, cls = "" }: { children: React.ReactNode; cls?: string }) {
  return <div className={`chem-compare-cell ${cls}`}>{children}</div>;
}

/** مقارنة جانبية بين أي مفهومين أو مادتين */
export function ComparePanel() {
  const [aId, setAId] = useState("element");
  const [bId, setBId] = useState("compound");
  const a = itemsById[aId];
  const b = itemsById[bId];

  const rows: { label: string; get: (i: typeof a) => React.ReactNode }[] = [
    { label: "التصنيف", get: (i) => CATEGORY_LABELS[i.category] },
    { label: "الرمز / الصيغة", get: (i) => <span style={{ direction: "ltr", display: "inline-block", fontWeight: 800 }}>{i.symbolOrFormula ?? "—"}</span> },
    { label: "ما هو؟", get: (i) => i.shortDescription },
    {
      label: "خصائص سريعة",
      get: (i) => (
        <ul>
          {i.properties.slice(0, 3).map((p, k) => (
            <li key={k}>{p}</li>
          ))}
        </ul>
      ),
    },
    { label: "الأهمية", get: (i) => i.importance },
    { label: "مثال / استخدام", get: (i) => i.commonUses[0] },
    { label: "السلامة", get: (i) => i.safetyNotes },
  ];

  return (
    <div className="chem-page">
      <div className="chem-page-head">
        <h2>⚖ أداة المقارنة</h2>
        <p>ضع مفهومين وجهًا لوجه لتتضح الفروق. اختر مقارنة جاهزة أو ركّب مقارنتك الخاصة.</p>
      </div>

      <div className="chem-preset-row">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`chem-chip ${aId === p.a && bId === p.b ? "active" : ""}`}
            onClick={() => {
              setAId(p.a);
              setBId(p.b);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="chem-compare-pickers">
        <select className="chem-select" value={aId} onChange={(e) => setAId(e.target.value)} aria-label="الطرف الأول">
          {chemistryItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.arabicName} ({CATEGORY_LABELS[i.category]})
            </option>
          ))}
        </select>
        <span className="chem-vs">مقابل</span>
        <select className="chem-select" value={bId} onChange={(e) => setBId(e.target.value)} aria-label="الطرف الثاني">
          {chemistryItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.arabicName} ({CATEGORY_LABELS[i.category]})
            </option>
          ))}
        </select>
      </div>

      <div className="chem-compare-table">
        <Cell cls="head label"> </Cell>
        <Cell cls="head">{a.arabicName}</Cell>
        <Cell cls="head">{b.arabicName}</Cell>
        {rows.map((row) => (
          <Fragment key={row.label}>
            <Cell cls="label">{row.label}</Cell>
            <Cell>{row.get(a)}</Cell>
            <Cell>{row.get(b)}</Cell>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
