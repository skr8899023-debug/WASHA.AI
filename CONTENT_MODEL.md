# CONTENT MODEL

## ChemistryItem (`src/chem/data/chemistryItems.ts`)
```ts
{
  id: string;                 // kebab, e.g. "hydrogen"
  arabicName: string;         // الهيدروجين
  englishName: string;        // Hydrogen
  symbolOrFormula?: string;   // H / H₂O — scientific symbols stay Latin
  category: "concept" | "element" | "compound" | "tool";
  shortDescription: string;   // ما هو؟ — 1–2 sentences
  importance: string;         // لماذا هو مهم؟
  properties: string[];       // خصائص سريعة (3–5 bullets)
  commonUses: string[];       // استخدامات (2–4 bullets)
  misconception: string;      // خطأ شائع + التصحيح
  thinkingQuestion: string;   // سؤال تفكير
  relatedExperiments: string[]; // experiment ids
  safetyNotes: string;        // ملاحظات السلامة
  sourceNotes: string;        // مصدر المحتوى
  visual: Visual;             // see below
  lastReviewed: string;       // ISO date
}
```

## Visual union
- `{ kind:"atom", color, shells:number[] }` — electrons per shell, animated orbits
- `{ kind:"molecule", atoms:{el,color,r,pos:[x,y,z]}[], bonds:[a,b][] }` — ball & stick
- `{ kind:"tool", tool:"beaker"|"testTube"|"flask"|"dropper"|"scale"|"burner"|"phStrip"|"goggles"|"gloves" }`
- `{ kind:"concept", icon:string, color }` — sidebar-only (not placed in 3D scene)

## Experiment (`experiments.ts`)
```ts
{ id, title, subtitle, goal, safety, conclusion,
  steps: { title, description, stage: StageState }[] }
```
`StageState` drives the SVG ExperimentStage:
`{ liquidColor?, liquidLevel?, particles?: {color,count,settled?}, bubbles?, flame?,
   phValue?, badges?: {text,color}[], caption }`

## Quiz (`quizzes.ts`)
`{ id, question, choices: string[4], correctIndex, explanation, topic }`

## Learning journey (`learningJourneys.ts`)
`{ id, title, subtitle, icon, color, steps: { title, body, tip?, relatedItemId? }[] }`
`relatedItemId` deep-links into explore mode with camera focus.

## Language rules
- All UI text Arabic; Latin only for symbols/formulas and English scientific names.
- Short sections, no walls of text. Educational tone for grades 7–12.
