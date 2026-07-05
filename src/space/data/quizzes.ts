import { CELESTIAL_BODIES } from "./celestialBodies";
import type { QuizQuestion } from "../utils/astronomyTypes";

/** Extra general questions beyond the per-body ones. */
const GENERAL_QUESTIONS: QuizQuestion[] = [
  {
    id: "gen-q1",
    question: "كم عدد الكواكب الرئيسية في النظام الشمسي وفق تعريف الاتحاد الفلكي الدولي؟",
    choices: ["سبعة", "ثمانية", "تسعة"],
    correctIndex: 1,
    explanation: "ثمانية كواكب رئيسية؛ أما بلوتو وسيريس وإريس فتصنف كواكب قزمة.",
  },
  {
    id: "gen-q2",
    question: "أي الكواكب التالية من العمالقة الجليدية؟",
    choices: ["المشتري وزحل", "أورانوس ونبتون", "الأرض والمريخ"],
    correctIndex: 1,
    explanation: "أورانوس ونبتون يحويان نسبة أكبر من الماء والأمونيا والميثان، فيسميان عملاقين جليديين.",
  },
  {
    id: "gen-q3",
    question: "ما الوحدة الفلكية (AU)؟",
    choices: [
      "المسافة بين الأرض والقمر",
      "متوسط المسافة بين الأرض والشمس",
      "قطر النظام الشمسي",
    ],
    correctIndex: 1,
    explanation: "الوحدة الفلكية نحو ١٥٠ مليون كيلومتر: متوسط بعد الأرض عن الشمس، وتستخدم لقياس مسافات النظام الشمسي.",
  },
  {
    id: "gen-q4",
    question: "أي ترتيب صحيح من الأقرب إلى الأبعد عن الشمس؟",
    choices: [
      "الزهرة، عطارد، الأرض، المريخ",
      "عطارد، الزهرة، الأرض، المريخ",
      "عطارد، الأرض، الزهرة، المريخ",
    ],
    correctIndex: 1,
    explanation: "الترتيب الصحيح للكواكب الداخلية: عطارد ثم الزهرة ثم الأرض ثم المريخ.",
  },
];

/** Full quiz bank: general questions + one per seeded body. */
export const QUIZ_BANK: QuizQuestion[] = [
  ...GENERAL_QUESTIONS,
  ...CELESTIAL_BODIES.flatMap((b) => b.quiz),
];

/** Deterministic-ish shuffled selection for a quiz round. */
export function buildQuizRound(count = 8): QuizQuestion[] {
  const pool = [...QUIZ_BANK];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
