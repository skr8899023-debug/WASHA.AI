const RULES = [
  "ارتدِ النظارات والقفازات قبل لمس أي مادة.",
  "لا تذوّق ولا تشمّ أي مادة بشكل مباشر.",
  "أضِف الحمض إلى الماء، لا العكس.",
  "لا تخلط مواد خارج التجارب المعتمدة.",
];

/** لوحة السلامة الثابتة لمنطقة التفاعلات */
export function ReactionSafetyPanel() {
  return (
    <div className="rxn-safety">
      <div className="rxn-safety-head">🥽 سلامة منطقة التفاعلات</div>
      <ul>
        {RULES.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
      <p className="rxn-safety-note">
        هذه محاكاة آمنة؛ التفاعلات الموسومة <b>«عرض تعليمي فقط»</b> تُشرح كمفهوم دون أي تنفيذ واقعي خطر.
      </p>
    </div>
  );
}
