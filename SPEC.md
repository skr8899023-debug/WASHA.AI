# أطلس الفضاء التفاعلي — Product Spec

## Vision
Arabic-first, RTL, cinematic 3D educational space atlas for middle/high-school students.
Feels like a premium museum exhibit + interactive space simulator, not a dashboard.

## Placement in this repo
- Root route `/` → **أطلس الفضاء التفاعلي** (new app, `src/space/`).
- `/design/washa-ai/app` and `/design/washa-ai/dev` → existing WASHA studio (untouched).

## Core experience
1. Home scene: 3D solar system — luminous Sun, 8 planets (Saturn ringed, Earth with Moon),
   asteroid belt particles, Pluto + Ceres, a comet with tail, a sample asteroid and spacecraft,
   plus distant deep-space objects (Milky Way, black hole, nebula, exoplanet system).
2. Hover → Arabic label. Click → smooth camera focus, other bodies dim, knowledge panel opens.
3. Knowledge panel sections: ما هو؟ / لماذا هو مهم؟ / أرقام سريعة / تصحيح مفهوم شائع /
   سؤال تفكير / اختبار قصير / مصدر وملاحظة علمية.
4. Reset camera, toggle orbit lines, toggle educational scale mode (3 presets).

## Modes
- **استكشف**: free exploration.
- **تعلّم**: guided journeys (6 seeded) — step cards that focus the camera per step.
- **اختبر نفسك**: Arabic MCQ quiz with immediate feedback, explanation, score.

## Comparison tool
Compare any two bodies with metrics: القطر، البعد عن الشمس، مدة اليوم، مدة السنة،
عدد الأقمار، الحرارة/طبيعة السطح. Rendered as clean normalized bars (log scale where needed).

## Data-driven architecture
All content lives in `src/space/data/`. Adding a body = adding one object to
`celestialBodies.ts` (see CONTENT_MODEL.md). 3D rendering is generic per `visual.kind`.

## Visual direction
Deep cosmic black/midnight blue; gold, cyan, violet, solar amber accents.
Layered starfield, orbit lines, glow halos, slow orbital motion, smooth camera lerp.
Arabic typography via system stack. No SaaS cards, no English-first layout.

## Scientific accuracy
Conservative, stable NASA/IAU figures only. Pluto presented as dwarf planet per IAU 2006.
Volatile counts (e.g. moons) phrased as "يتغير الرقم مع الاكتشافات الجديدة".
Every body carries `sourceNotes` + `lastReviewed`.

## Performance
Instanced particles for stars/asteroid belt, capped counts, procedural canvas textures
(no large assets), memoized geometry/materials, `prefers-reduced-motion` respected
(orbital motion pauses, camera transitions shorten).

## Non-goals (now)
Exoplanet catalogue module (schema-ready, one seed object only), teacher accounts,
persistence, i18n beyond Arabic.
