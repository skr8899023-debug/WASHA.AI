import type { Reaction } from "../types";

/**
 * تفاعلات صفّية آمنة ومبسّطة، مقادة بالبيانات.
 * تُطابَق المواد كمجموعة غير مرتبة؛ والشروط (تسخين/تحريك) تُميّز النواتج.
 * لا وصفات خطرة؛ وأي تفاعل غير آمن للتنفيذ يُوسم "عرض تعليمي فقط".
 */
export const reactions: Reaction[] = [
  // 1) حمض + قاعدة → تعادل
  {
    id: "acid-base",
    title: "حمض + قاعدة",
    reactants: ["hcl", "naoh"],
    outcome: "neutralization",
    visual: { liquidColor: "#7fd1e0", liquidLevel: 0.6, glow: true, phValue: 7 },
    explanation: {
      what: "اندمج الحمض والقاعدة وتلاشت حِدّة كليهما وتكوّن ماء وملح ذائب.",
      why: "أيون الهيدروجين H⁺ من الحمض التقى أيون الهيدروكسيد OH⁻ من القاعدة فكوّنا ماءً متعادلًا.",
      type: "تفاعل تعادل (حمض–قاعدة).",
      evidence: "ارتفاع طفيف في الحرارة، واقتراب الرقم الهيدروجيني من 7.",
      equation: "HCl + NaOH → NaCl + H₂O",
      safety: "الحمض والقاعدة المركّزان كاويان؛ نستخدم محاليل مخفّفة وبإشراف المعلم.",
    },
  },
  // 2) حمض + كربونات → غاز
  {
    id: "acid-carbonate",
    title: "حمض + بيكربونات الصوديوم",
    reactants: ["hcl", "baking-soda"],
    outcome: "gas",
    visual: { liquidColor: "#d7f2fb", liquidLevel: 0.55, bubbles: true, foam: true },
    explanation: {
      what: "تصاعدت فقاعات غزيرة ورغوة فوّارة فور ملامسة الحمض للمسحوق.",
      why: "تفاعل الحمض مع البيكربونات أطلق غاز ثاني أكسيد الكربون CO₂ الذي كوّن الفقاعات.",
      type: "تفاعل ينتج غازًا (حمض–كربونات).",
      evidence: "فوران وفقاعات ورغوة، وإذا قرّبنا عود ثقاب مشتعلًا فوقها ينطفئ.",
      equation: "HCl + NaHCO₃ → NaCl + H₂O + CO₂↑",
      safety: "آمن؛ لكن لا نغلق الوعاء بإحكام حتى لا يتراكم الغاز.",
    },
  },
  {
    id: "vinegar-carbonate",
    title: "خل + بيكربونات الصوديوم",
    reactants: ["vinegar", "baking-soda"],
    outcome: "gas",
    visual: { liquidColor: "#f3efd6", liquidLevel: 0.55, bubbles: true, foam: true },
    explanation: {
      what: "فوران أبيض ورغوة تعلو سطح السائل (تجربة البركان الشهيرة).",
      why: "حمض الأسيتيك في الخل يتفاعل مع البيكربونات فيتحرر غاز ثاني أكسيد الكربون.",
      type: "تفاعل ينتج غازًا (حمض–كربونات).",
      evidence: "رغوة وفقاعات مسموعة وانخفاض بسيط في الحرارة.",
      equation: "CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂↑",
      safety: "آمن تمامًا للتجربة الصفّية.",
    },
  },
  // 3) نترات الفضة + كلوريد الصوديوم → راسب
  {
    id: "silver-chloride",
    title: "نترات الفضة + كلوريد الصوديوم",
    reactants: ["silver-nitrate", "salt"],
    outcome: "precipitate",
    visual: { liquidColor: "#eef2f6", liquidLevel: 0.6, precipitate: { color: "#f8fafc" } },
    explanation: {
      what: "تكوّن راسب أبيض حليبي يتساقط ببطء إلى قاع الكأس.",
      why: "اتحد أيون الفضة Ag⁺ مع أيون الكلوريد Cl⁻ مكوّنًا كلوريد الفضة غير الذائب.",
      type: "تفاعل ترسيب (تبادل أيوني).",
      evidence: "عكارة بيضاء ثم راسب يستقر في القاع.",
      equation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
      safety: "نترات الفضة تترك بقعًا داكنة على الجلد؛ نلبس القفازات.",
    },
  },
  // 4) ملح + ماء → ذوبان / تبلور (حسب التسخين)
  {
    id: "salt-water",
    title: "ملح + ماء",
    reactants: ["salt", "water"],
    outcome: "dissolution",
    visual: { liquidColor: "#cdeafd", liquidLevel: 0.6 },
    explanation: {
      what: "اختفت بلورات الملح تدريجيًا وأصبح المحلول شفافًا متجانسًا.",
      why: "أحاطت جزيئات الماء القطبية بأيونات الصوديوم والكلوريد فسحبتها بعيدًا (إماهة).",
      type: "ذوبان (تغيّر فيزيائي).",
      evidence: "اختفاء الصلب وبقاء سائل صافٍ يمكن استرجاع ملحه بالتبخير.",
      equation: "NaCl (صلب) → Na⁺(aq) + Cl⁻(aq)",
      safety: "آمن؛ حرّك برفق دون رذاذ.",
    },
  },
  {
    id: "salt-water-crystallize",
    title: "تبخير محلول الملح",
    reactants: ["salt", "water"],
    requires: { heat: true },
    outcome: "crystallization",
    visual: { liquidColor: "#dbeafe", liquidLevel: 0.18, vapor: true, precipitate: { color: "#ffffff" }, glow: true },
    explanation: {
      what: "تصاعد بخار الماء وانخفض مستوى السائل، ثم ظهرت بلورات ملح بيضاء في القاع.",
      why: "الحرارة بخّرت الماء وتركت أيونات الملح تعيد ترتيب نفسها في شبكة بلورية.",
      type: "تبخّر ثم تبلور (تغيّر فيزيائي).",
      evidence: "بخار متصاعد، وانخفاض المستوى، وبلورات صلبة متبقية.",
      equation: "Na⁺(aq) + Cl⁻(aq) → NaCl (بلورات) + H₂O↑",
      safety: "احذر البخار الساخن والزجاج الحار؛ استخدم الماسك.",
    },
  },
  // 5) الكاشف مع حمض / قاعدة → تغيّر لوني (تغيّر الحموضة)
  {
    id: "indicator-acid",
    title: "الكاشف + حمض",
    reactants: ["indicator", "hcl"],
    outcome: "color",
    visual: { liquidColor: "#ef4444", liquidLevel: 0.55, phValue: 2 },
    explanation: {
      what: "تحوّل لون الكاشف الأخضر إلى الأحمر فور إضافة الحمض.",
      why: "الوسط الحمضي (كثرة أيونات H⁺) يغيّر تركيب جزيئات الكاشف فيتغيّر لونه.",
      type: "كشف حموضة (تغيّر لوني يدل على pH منخفض).",
      evidence: "لون أحمر يوافق رقمًا هيدروجينيًا أقل من 7.",
      equation: "كاشف + H⁺ → صيغة حمراء (pH ≈ 2)",
      safety: "الكاشف آمن بكميات قليلة؛ لا يُبلع.",
    },
  },
  {
    id: "indicator-base",
    title: "الكاشف + قاعدة",
    reactants: ["indicator", "naoh"],
    outcome: "color",
    visual: { liquidColor: "#8b5cf6", liquidLevel: 0.55, phValue: 13 },
    explanation: {
      what: "تحوّل لون الكاشف إلى البنفسجي/الأزرق بعد إضافة القاعدة.",
      why: "الوسط القاعدي (كثرة أيونات OH⁻) يغيّر جزيئات الكاشف نحو الصيغة البنفسجية.",
      type: "كشف قاعدية (تغيّر لوني يدل على pH مرتفع).",
      evidence: "لون بنفسجي يوافق رقمًا هيدروجينيًا أكبر من 7.",
      equation: "كاشف + OH⁻ → صيغة بنفسجية (pH ≈ 13)",
      safety: "القاعدة كاوية؛ قفازات ونظارات.",
    },
  },
  {
    id: "indicator-water",
    title: "الكاشف + ماء",
    reactants: ["indicator", "water"],
    outcome: "color",
    visual: { liquidColor: "#57c785", liquidLevel: 0.55, phValue: 7 },
    explanation: {
      what: "بقي لون الكاشف أخضر معتدلًا في الماء النقي.",
      why: "الماء النقي متعادل (تركيز H⁺ يساوي OH⁻) فلا يميل اللون للحمرة ولا للبنفسجة.",
      type: "قياس تعادل (لون مرجعي عند pH 7).",
      evidence: "لون أخضر ثابت يمثّل الحياد.",
      equation: "كاشف + ماء متعادل → لون أخضر (pH = 7)",
      safety: "آمن.",
    },
  },
  // 6) أكسدة الحديد (صدأ) — بطيء، يُعرض مفهوميًا
  {
    id: "iron-rust",
    title: "أكسدة الحديد (الصدأ)",
    reactants: ["iron", "water"],
    outcome: "color",
    conceptualOnly: true,
    visual: { liquidColor: "#c9d2dc", liquidLevel: 0.5, precipitate: { color: "#b45309" } },
    explanation: {
      what: "تكوّنت طبقة برتقالية بنية على برادة الحديد بمرور الوقت (نعرضها مسرّعة).",
      why: "يتحد الحديد مع الأكسجين الذائب في الماء ببطء مكوّنًا أكسيد الحديد (الصدأ).",
      type: "تفاعل أكسدة (تغيّر كيميائي بطيء).",
      evidence: "لون برتقالي بني وتفتّت سطح الحديد.",
      equation: "4Fe + 3O₂ → 2Fe₂O₃ (صدأ)",
      safety: "عرض تعليمي فقط لأنه يستغرق أيامًا في الواقع؛ آمن.",
    },
  },
  // 7) تسخين الماء → تبخّر (تغيّر فيزيائي)
  {
    id: "water-heat",
    title: "تسخين الماء",
    reactants: ["water"],
    requires: { heat: true },
    outcome: "evaporation",
    visual: { liquidColor: "#bfe8ff", liquidLevel: 0.35, bubbles: true, vapor: true, glow: true },
    explanation: {
      what: "ظهرت فقاعات صغيرة ثم تصاعد بخار ماء وانخفض مستوى السائل.",
      why: "الحرارة زادت طاقة الجزيئات حتى تحوّل بعضها من الحالة السائلة إلى الغازية.",
      type: "تبخّر/غليان (تغيّر فيزيائي، لا مادة جديدة).",
      evidence: "بخار متصاعد وانخفاض المستوى، والماء نفسه لم يتغيّر كيميائيًا.",
      equation: "H₂O (سائل) → H₂O (بخار)",
      safety: "احذر البخار الساخن؛ لا توجّه فوهة الوعاء نحو الوجه.",
    },
  },
  // 8) خلط مواد لا تتفاعل — زيت وماء
  {
    id: "oil-water",
    title: "زيت + ماء",
    reactants: ["oil", "water"],
    outcome: "physical",
    visual: { liquidColor: "#bfe8ff", liquidLevel: 0.62, foam: false },
    explanation: {
      what: "لم يمتزج السائلان وتكوّنت طبقتان منفصلتان (الزيت يطفو فوق الماء).",
      why: "الماء قطبي والزيت غير قطبي، فلا تنجذب جزيئاتهما لبعضها ولا يذوب أحدهما في الآخر.",
      type: "لا تفاعل — مجرد خلط فيزيائي لسائلين غير ممتزجين.",
      evidence: "طبقتان واضحتان بحدّ فاصل، ولا فقاعات ولا حرارة ولا لون جديد.",
      equation: "زيت + ماء → طبقتان (لا مادة جديدة)",
      safety: "آمن؛ الأسطح الزيتية زلقة.",
    },
  },
];

export const reactionsById: Record<string, Reaction> = Object.fromEntries(
  reactions.map((r) => [r.id, r]),
);
