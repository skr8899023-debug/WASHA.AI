# SPEC — مختبر الكيمياء التفاعلي

Arabic-first, RTL, 3D interactive chemistry learning lab for middle/secondary students.

## Coexistence with existing app
Repo already contains WASHA studio at `/design/washa-ai/app|dev`. The chemistry lab becomes the
**root app** (`/`), namespaced under `src/chem/`. WASHA routes remain untouched. `document.title`
is set per route.

## Stack
Vite + React 18 + TypeScript + three.js + @react-three/fiber v8 + @react-three/drei v9 + zustand v4.
Fonts: @fontsource/tajawal (self-hosted). Plain CSS (`src/chem/styles/chem.css`), no UI framework.

## Modules
1. **استكشف** — 3D lab scene: elements arc (atom models: nucleus + animated electron shells),
   compounds row (ball-and-stick molecules), lab-tools bench (procedural glassware). Hover Arabic
   labels (drei `<Html>` — reliable Arabic shaping), click → camera focus (damped lerp), sidebar
   item browser incl. concepts, reset-view + labels toggle. Knowledge panel opens on selection.
2. **Knowledge panel** — per item: Arabic/English names, symbol/formula, category, ما هو؟، لماذا هو
   مهم؟، خصائص سريعة، استخدامات، خطأ شائع، سؤال تفكير، تجارب مرتبطة (deep-link), ملاحظات السلامة،
   مصادر.
3. **تعلّم** — 9 guided journeys, step navigation, progress, steps can deep-link to a 3D item.
4. **التجارب** — 7 simulations rendered by one flexible SVG `ExperimentStage` (beaker, particles,
   bubbles, flame, pH strip, molecule badges) driven by data-defined steps. Step-by-step buttons,
   reset, explanation per step.
5. **اختبر نفسك** — MCQ quiz, immediate feedback + explanation, score, restart.
6. **قارن** — preset pairs + free pick of any two items; side-by-side attribute table.
7. **السلامة** — dedicated safety cards section.

## Data-driven content
`src/chem/data/`: chemistryItems.ts (13 concepts, 10 elements, 7 compounds, 9 tools),
experiments.ts (7), quizzes.ts (16 MCQ), learningJourneys.ts (9). Types in `src/chem/types.ts`.
Visual config lives on each item (`atom` shells / `molecule` atoms+bonds / `tool` kind / `concept`).

## Visual direction
Dark scientific atmosphere: deep navy background, glass panels with blur, accents — cyan (primary),
emerald (success/base), amber (caution), red (danger/acid), violet (energy). Floating ambient
particles in scene, soft lights, subtle floor grid.

## Performance
Shared memoized geometries/materials, low-poly primitives, ≤ ~40 scene objects, dpr clamp [1,2],
no postprocessing.

## Done criteria
Build + typecheck pass; explore/select/focus works; panels, lessons, experiments, quiz, compare,
safety all functional; no fake buttons; no placeholder text; PROGRESS.md updated.
