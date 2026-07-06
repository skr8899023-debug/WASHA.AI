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

export type Mode = "explore" | "learn" | "experiments" | "quiz" | "compare" | "safety";

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
