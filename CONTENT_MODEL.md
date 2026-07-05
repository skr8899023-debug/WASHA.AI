# CONTENT_MODEL — Data schema

All educational content is data-driven. Components never hard-code facts.

## CelestialBody (`src/space/data/celestialBodies.ts`)

```ts
interface CelestialBody {
  id: string;                 // stable slug, e.g. "mars"
  arabicName: string;         // "المريخ"
  englishName: string;        // "Mars"
  category: BodyCategory;     // star | planet | dwarf-planet | moon | belt |
                              // asteroid | comet | mission | deep-space | exoplanet
  shortDescription: string;   // ما هو؟ — 1–2 sentences, Arabic
  importance: string;         // لماذا هو مهم؟ — 1–2 sentences
  quickFacts: string[];       // أرقام سريعة — 3–5 short bullets
  misconception?: { wrong: string; correct: string };
  thinkingQuestion: string;   // سؤال تفكير
  quiz: QuizQuestion[];       // 1–2 per body (interactive experience)
  metrics?: {                 // numeric fields for the compare tool (optional per field)
    diameterKm?: number;
    distanceFromSunAU?: number;
    dayLengthHours?: number;  // rotation period
    yearLengthDays?: number;  // orbital period
    moonCount?: number | "variable"; // "variable" → rendered as نص تعليمي
    moonCountNote?: string;   // e.g. "يتغير الرقم مع الاكتشافات الجديدة"
    tempNote?: string;        // conservative text, not fake precision
    surfaceNote?: string;
  };
  visual: VisualConfig;       // drives generic 3D rendering (below)
  sourceNotes: string;        // e.g. "NASA Solar System Exploration; IAU"
  difficulty: "أساسي" | "متوسط" | "متقدم";
  lastReviewed: string;       // ISO date
}
```

## VisualConfig
```ts
interface VisualConfig {
  kind: "star" | "planet" | "moon" | "belt" | "comet" | "asteroid"
      | "galaxy" | "blackhole" | "nebula" | "spacecraft" | "exoplanet";
  color: string;              // base color
  accentColor?: string;       // bands/glow accent
  radius: number;             // educational relative radius (scaled by scale mode)
  orbitRadius?: number;       // educational orbit distance (not to scale)
  orbitSpeed?: number;        // radians/sec at normal speed
  tiltDeg?: number;
  rings?: { inner: number; outer: number; color: string };
  parentId?: string;          // e.g. moon orbits "earth"
  texture?: "banded" | "rocky" | "earth" | "sun" | "icy";  // procedural generator id
  fixedPosition?: [number, number, number]; // deep-space objects
}
```

## QuizQuestion (`quizzes.ts` + per-body)
```ts
interface QuizQuestion {
  id: string;
  question: string;           // Arabic
  choices: string[];          // 3–4 Arabic choices
  correctIndex: number;
  explanation: string;        // shown after answering
  relatedBodyId?: string;
}
```

## Journey (`journeys.ts`)
```ts
interface Journey {
  id: string;
  title: string;              // Arabic
  subtitle: string;
  steps: {
    bodyId: string;           // camera focuses this body
    title: string;
    text: string;             // short Arabic lesson card
  }[];
}
```

## Adding content
- New body → append one object to `CELESTIAL_BODIES`. Rendering, labels, panel,
  compare and focus work automatically from `visual` + `metrics`.
- New journey → append to `JOURNEYS` referencing existing body ids.
- New quiz question → append to `GENERAL_QUIZ` or a body's `quiz`.
- Keep volatile numbers as text notes ("أكثر من ٩٠ قمرًا ويتغير العدد…"), never fake precision.
