export type BodyCategory =
  | "star"
  | "planet"
  | "dwarf-planet"
  | "moon"
  | "belt"
  | "asteroid"
  | "comet"
  | "mission"
  | "deep-space"
  | "exoplanet";

export const CATEGORY_LABELS: Record<BodyCategory, string> = {
  star: "نجم",
  planet: "كوكب",
  "dwarf-planet": "كوكب قزم",
  moon: "قمر",
  belt: "حزام كويكبات",
  asteroid: "كويكب",
  comet: "مذنب",
  mission: "مهمة فضائية",
  "deep-space": "فضاء عميق",
  exoplanet: "كوكب خارجي",
};

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  relatedBodyId?: string;
}

export type VisualKind =
  | "star"
  | "planet"
  | "moon"
  | "belt"
  | "comet"
  | "asteroid"
  | "galaxy"
  | "blackhole"
  | "nebula"
  | "spacecraft"
  | "exoplanet";

export type ProceduralTexture = "banded" | "rocky" | "earth" | "sun" | "icy";

export interface VisualConfig {
  kind: VisualKind;
  color: string;
  accentColor?: string;
  radius: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitPhase?: number;
  tiltDeg?: number;
  rings?: { inner: number; outer: number; color: string };
  parentId?: string;
  texture?: ProceduralTexture;
  fixedPosition?: [number, number, number];
}

export interface BodyMetrics {
  diameterKm?: number;
  distanceFromSunAU?: number;
  dayLengthHours?: number;
  yearLengthDays?: number;
  moonCount?: number | "variable";
  moonCountNote?: string;
  tempNote?: string;
  surfaceNote?: string;
}

export interface CelestialBody {
  id: string;
  arabicName: string;
  englishName: string;
  category: BodyCategory;
  shortDescription: string;
  importance: string;
  quickFacts: string[];
  misconception?: { wrong: string; correct: string };
  thinkingQuestion: string;
  quiz: QuizQuestion[];
  metrics?: BodyMetrics;
  visual: VisualConfig;
  sourceNotes: string;
  difficulty: "أساسي" | "متوسط" | "متقدم";
  lastReviewed: string;
}

export interface JourneyStep {
  bodyId: string;
  title: string;
  text: string;
}

export interface Journey {
  id: string;
  title: string;
  subtitle: string;
  steps: JourneyStep[];
}

export type AppMode = "explore" | "learn" | "quiz";

export type ScaleMode = "approx" | "teaching" | "simplified";

export const SCALE_MODE_LABELS: Record<ScaleMode, string> = {
  approx: "حجم تقريبي",
  teaching: "ترتيب تعليمي غير مطابق للمسافات",
  simplified: "مقارنة نسبية مبسطة",
};
