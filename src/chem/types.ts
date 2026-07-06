export type Category = "concept" | "element" | "compound" | "tool";

export type ToolKind =
  | "beaker"
  | "testTube"
  | "flask"
  | "dropper"
  | "scale"
  | "burner"
  | "phStrip"
  | "goggles"
  | "gloves";

export type Visual =
  | { kind: "atom"; color: string; shells: number[] }
  | {
      kind: "molecule";
      atoms: { el: string; color: string; r: number; pos: [number, number, number] }[];
      bonds: [number, number][];
    }
  | { kind: "tool"; tool: ToolKind }
  | { kind: "concept"; icon: string; color: string };

export interface ChemistryItem {
  id: string;
  arabicName: string;
  englishName: string;
  symbolOrFormula?: string;
  category: Category;
  shortDescription: string;
  importance: string;
  properties: string[];
  commonUses: string[];
  misconception: string;
  thinkingQuestion: string;
  relatedExperiments: string[];
  safetyNotes: string;
  sourceNotes: string;
  visual: Visual;
  lastReviewed: string;
}

export interface StageState {
  liquidColor?: string;
  liquidLevel?: number; // 0..1
  particles?: { color: string; count: number; settled?: boolean };
  bubbles?: boolean;
  flame?: boolean;
  phValue?: number; // 0..14
  badges?: { text: string; color: string }[];
  caption: string;
}

export interface ExperimentStep {
  title: string;
  description: string;
  stage: StageState;
}

export interface Experiment {
  id: string;
  title: string;
  subtitle: string;
  goal: string;
  safety: string;
  conclusion: string;
  steps: ExperimentStep[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export interface JourneyStep {
  title: string;
  body: string;
  tip?: string;
  relatedItemId?: string;
}

export interface LearningJourney {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  steps: JourneyStep[];
}

export type Mode = "explore" | "learn" | "experiments" | "quiz" | "compare" | "safety" | "reactions";

// ============ منطقة التفاعلات الكيميائية ============

export type ChemicalKind =
  | "acid"
  | "base"
  | "salt"
  | "carbonate"
  | "metal"
  | "indicator"
  | "water"
  | "other";

export type ChemicalState = "liquid" | "solid" | "powder";

export interface Chemical {
  id: string;
  arabicName: string;
  englishName: string;
  formula: string;
  kind: ChemicalKind;
  state: ChemicalState;
  /** لون المادة أو محلولها في الكأس */
  color: string;
  phValue?: number; // للأحماض والقواعد
  hint: string; // وصف قصير يظهر على البطاقة
  safety: string;
  icon: string;
}

export type OutcomeType =
  | "none"
  | "color"
  | "gas"
  | "precipitate"
  | "phShift"
  | "tempChange"
  | "dissolution"
  | "crystallization"
  | "neutralization"
  | "evaporation"
  | "physical";

export const OUTCOME_LABELS: Record<OutcomeType, string> = {
  none: "لا تفاعل",
  color: "تغيّر لوني",
  gas: "انطلاق غاز",
  precipitate: "تكوّن راسب",
  phShift: "تغيّر الحموضة",
  tempChange: "تغيّر حراري",
  dissolution: "ذوبان",
  crystallization: "تبلور",
  neutralization: "تعادل",
  evaporation: "تبخّر",
  physical: "تغيّر فيزيائي",
};

/** الحالة المرئية التي تقود مشهد المزج ثلاثي الأبعاد */
export interface ReactionVisual {
  liquidColor?: string;
  liquidLevel?: number; // 0..1 (تُحسب تلقائيًا إن غابت)
  bubbles?: boolean;
  foam?: boolean;
  vapor?: boolean;
  glow?: boolean;
  phValue?: number;
  precipitate?: { color: string };
}

export interface ReactionExplanation {
  what: string; // ماذا حدث؟
  why: string; // لماذا حدث؟
  type: string; // نوع التفاعل؟
  evidence: string; // الدليل المرئي؟
  equation: string; // المعادلة المبسطة؟
  safety: string; // ملاحظة السلامة؟
}

export interface Reaction {
  id: string;
  title: string;
  /** معرّفات المواد المتفاعلة (تُقارن كمجموعة غير مرتبة) */
  reactants: string[];
  /** الشروط المطلوبة لحدوث هذا الناتج تحديدًا */
  requires?: { heat?: boolean; stir?: boolean };
  outcome: OutcomeType;
  visual: ReactionVisual;
  explanation: ReactionExplanation;
  /** تفاعل يُعرض كمفهوم فقط دون خطوات واقعية خطرة */
  conceptualOnly?: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  concept: "مفهوم",
  element: "عنصر",
  compound: "مركب",
  tool: "أداة مختبر",
};

export const TOOL_ICONS: Record<ToolKind, string> = {
  beaker: "🧪",
  testTube: "🧪",
  flask: "⚗",
  dropper: "💧",
  scale: "⚖",
  burner: "🔥",
  phStrip: "🌡",
  goggles: "🥽",
  gloves: "🧤",
};

/** أيقونة/رمز موحّد لعرض أي عنصر محتوى في الشارات والقوائم */
export function itemBadge(item: { symbolOrFormula?: string; visual: Visual }): string {
  if (item.visual.kind === "concept") return item.visual.icon;
  if (item.visual.kind === "tool") return TOOL_ICONS[item.visual.tool];
  return item.symbolOrFormula ?? "•";
}
