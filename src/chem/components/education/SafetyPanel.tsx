import { useChemistryStore } from "../../state/useChemistryStore";

const SAFETY_CARDS = [
  {
    icon: "🥽",
    color: "#22d3ee",
    title: "النظارات الواقية",
    body: "تُلبس قبل بدء أي تجربة ولا تُخلع حتى النهاية. تحمي عينيك من الرذاذ والشظايا — والعين لا تتجدد.",
    itemId: "goggles",
  },
  {
    icon: "🧤",
    color: "#34d399",
    title: "القفازات",
    body: "حاجز يمنع امتصاص جلدك للمواد الكيميائية. استبدلها فور تلوثها، ولا تلمس بها وجهك أو هاتفك.",
    itemId: "gloves",
  },
  {
    icon: "🤲",
    color: "#fbbf24",
    title: "التعامل الحذر",
    body: "أمسك الزجاجيات بكلتا يديك، ووجّه فوهة الأنبوب بعيدًا عن الوجوه، وأضف الحمض إلى الماء وليس العكس أبدًا.",
    itemId: "test-tube",
  },
  {
    icon: "🚫",
    color: "#f87171",
    title: "لا تذوق ولا شمّ مباشر",
    body: "ممنوع تذوق أي مادة مهما بدت مألوفة. لاستكشاف رائحة: حرّك البخار بيدك نحو أنفك بلطف من مسافة.",
    itemId: "acid",
  },
  {
    icon: "🧑‍🏫",
    color: "#a78bfa",
    title: "إشراف المعلم",
    body: "لا تبدأ تجربة قبل إذن المعلم، وأخبره فورًا عن أي انسكاب أو كسر أو إصابة — الإبلاغ السريع شجاعة.",
    itemId: "burner",
  },
  {
    icon: "⚠",
    color: "#fb923c",
    title: "افهم رموز الخطر",
    body: "قبل استخدام أي عبوة اقرأ ملصقها: رمز اللهب يعني قابلًا للاشتعال، ورمز التآكل يعني كاويًا، ورمز الجمجمة يعني سامًّا.",
    itemId: "naoh",
  },
];

const GOLDEN_RULES = [
  "اقرأ خطوات التجربة كاملة قبل أن تلمس أي أداة.",
  "اعرف أماكن طفاية الحريق وغسّالة العيون ومخرج الطوارئ.",
  "اربط الشعر الطويل وارتدِ حذاءً مغلقًا ومعطف المختبر.",
  "لا طعام ولا شراب داخل المختبر إطلاقًا.",
  "لا تُعد أي مادة فائضة إلى عبوتها الأصلية.",
  "نظّف مكان عملك واغسل يديك جيدًا قبل المغادرة.",
];

/** قسم السلامة: بطاقات مرجعية سريعة وقواعد ذهبية */
export function SafetyPanel() {
  const focusInLab = useChemistryStore((s) => s.focusInLab);
  return (
    <div className="chem-page">
      <div className="chem-page-head chem-safety-hero">
        <h2>🥽 السلامة أولًا</h2>
        <p>
          العالِم الحقيقي ليس من يجري أخطر التجارب، بل من يجريها بأمان. هذه القواعد ليست قيودًا — إنها ما يجعل
          الاستكشاف ممكنًا كل يوم.
        </p>
      </div>

      <div className="chem-grid">
        {SAFETY_CARDS.map((card) => (
          <button
            key={card.title}
            className="chem-card"
            style={{ "--card-accent": card.color } as React.CSSProperties}
            onClick={() => focusInLab(card.itemId)}
          >
            <div className="chem-card-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <div className="chem-card-meta">اعرض العنصر المرتبط في المختبر ←</div>
          </button>
        ))}
      </div>

      <div className="chem-safety-rules">
        <h3>⭐ القواعد الذهبية الست</h3>
        <ol>
          {GOLDEN_RULES.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
