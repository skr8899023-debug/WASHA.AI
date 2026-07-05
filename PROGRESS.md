# PROGRESS — أطلس الفضاء التفاعلي

## Status: Core experience complete ✅ · Independent QA pass complete ✅

## QA review (2026-07-05)
Reviewed code + UI against SPEC criteria (scientific accuracy, RTL quality, 3D visual
direction, selection/focus/reset, journeys/quiz/compare, mid-device performance,
build/typecheck). 7 real defects found and fixed:

1. **Science** — Moon rotation listed as 708.7 h (lunar *solar* day) under the label
   "مدة الدوران حول المحور"; corrected to 655.7 h (٢٧٫٣ يومًا, sidereal rotation,
   consistent with the tidal-locking fact). `data/celestialBodies.ts`
2. **Science** — Halley's comet showed a flat "البعد عن الشمس: ١٧٫٨ و.ف." (semi-major
   axis) — misleading for an e≈0.97 orbit. Metric removed; accurate perihelion/aphelion
   quick fact added (أقل من ١ و.ف. حتى نحو ٣٥ و.ف.). `data/celestialBodies.ts`
3. **Science/visual** — Exoplanet host star was inside the planet's spin group, so the
   star visibly orbited its planet. Moved outside the spin group. `CelestialBodyMesh.tsx`
4. **UX** — "قارن هذا الجرم" appeared for bodies excluded from the compare selects
   (مجرة/ثقب أسود/سديم/كوكب خارجي/فوياجر), desyncing the dropdowns. Button now gated by
   shared `isComparableBody()`. `ComparePanel.tsx`, `KnowledgePanel.tsx`
5. **RTL/dark UX** — global `color-scheme: light` meta made native select dropdowns and
   scrollbars render light inside the dark app; `.space-app { color-scheme: dark }` added.
6. **Robustness** — moon→earth "related body" relation was hardcoded; now derived from
   `visual.parentId` data. `CelestialBodyMesh.tsx`
7. **UX** — clicking the already-active mode button cleared the selection and reset the
   camera; now a no-op. `useSpaceStore.ts`

Re-verification after fixes: `npm run build` clean; Playwright flow re-run with two new
assertions — direct 3D canvas click on the Sun opens its panel (ok), compare button hidden
for الثقب الأسود (ok). Zero console errors across the full flow.

## What was built
- **Root route `/`** now serves the Arabic-first 3D space atlas (WASHA studio unchanged
  on `/design/washa-ai/app|dev`, all three routes lazy-loaded/code-split).
- **3D scene** (`src/space/components/three/`): procedural-textured Sun + 8 planets
  (Saturn ringed & tilted, Earth with orbiting Moon), instanced asteroid belt (~520 rocks),
  Pluto, Ceres, Halley's comet with sun-opposed tail, asteroid Bennu, Voyager 1 model,
  and deep-space set pieces (spiral-particle Milky Way, black hole with accretion ring,
  Orion nebula sprites, exoplanet + dim star). 2600-star background field, orbit guides,
  hover labels in Arabic, click-to-focus with smooth follow camera, dim-others on select,
  camera reset, orbit-lines toggle, 3 educational scale modes, prefers-reduced-motion respected.
- **Education UI** (`src/space/components/education/`): KnowledgePanel with the seven
  Arabic sections (ما هو؟ / لماذا هو مهم؟ / أرقام سريعة / تصحيح مفهوم / سؤال تفكير /
  تجربة تفاعلية / مصدر وملاحظة), GuidedJourneyPanel (6 journeys incl. Pluto/IAU story),
  QuizPanel (8-question rounds, immediate feedback + explanations + score),
  ComparePanel (diameter, distance, day, year, moons, temp — log-scaled bars).
- **Data** (`src/space/data/`): 20 seeded bodies with conservative NASA/IAU facts,
  `sourceNotes` + `lastReviewed` on every body, volatile counts phrased as
  "يتغير الرقم مع الاكتشافات الجديدة". 6 journeys, quiz bank (general + per-body).
- **Docs**: SPEC.md, TASKS.md, CONTENT_MODEL.md, CONTENT_SOURCES.md.

## Verification
- `npm run build` (tsc -b + vite build): **passes**, zero type errors.
- Playwright (Chromium 1440×900) end-to-end: home scene renders → select زحل via
  index strip → camera focuses, knowledge panel opens with facts/metrics → inline quiz
  answers with feedback → compare dialog (زحل × المريخ bars) → close/reset →
  learn mode → dwarf-planets journey steps focus bodies → quiz mode round with score →
  WASHA route still loads. **Zero console errors** across the whole flow.
- Screenshot review: cinematic dark scene, gold/cyan/violet accents, RTL layout correct.

## Known limitations / optional next steps
- Facts are fact-sheet-level; run the final NASA/IAU pass described in CONTENT_SOURCES.md
  before school-wide publication.
- Exoplanets are a single representative entry; the schema supports a full catalogue module.
- Bundle: three.js chunk ~255 kB gzip (only loaded on the atlas route).
- Optional: bloom postprocessing, audio narration, printable teacher sheets.
