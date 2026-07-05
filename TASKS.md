# TASKS — أطلس الفضاء التفاعلي

## Phase 1 — Plan ✅
- [x] Inspect repo (existing WASHA studio, Vite + React 18 + TS).
- [x] SPEC.md, TASKS.md, CONTENT_MODEL.md, CONTENT_SOURCES.md.
- [x] Install three / @react-three/fiber@8 / @react-three/drei@9 / zustand.

## Phase 2 — Build
- [x] Route: `/` → Space Atlas, keep `/design/washa-ai/*` for WASHA studio.
- [x] `src/space/utils/` — types, scale presets, Arabic number formatting.
- [x] `src/space/data/` — celestialBodies (20 bodies), journeys (6), quizzes.
- [x] `src/space/state/useSpaceStore.ts` — zustand store (selection, mode, toggles, quiz, compare).
- [x] 3D: SpaceScene, CelestialBodyMesh (per-kind rendering), StarField, AsteroidBelt,
      OrbitRings, CameraFocusController, procedural canvas textures.
- [x] Education UI: KnowledgePanel, GuidedJourneyPanel, QuizPanel, ComparePanel, SourceBadge.
- [x] Layout: TopBar, ModeSwitcher, scene controls (reset / orbits / scale mode).
- [x] Arabic RTL styling `src/space/styles/space.css`.

## Phase 3 — Verify
- [x] `npm run build` (tsc -b + vite build) passes.
- [x] Manual flow: open scene → select body → camera focus → panel → quiz/compare → reset.
- [x] Screenshot check vs visual direction.

## Phase 4 — Review
- [x] Diff vs SPEC.md, PROGRESS.md written, concise report.

## Later (optional)
- [ ] Exoplanet catalogue module (multiple systems).
- [ ] Teacher dashboard / printable lesson sheets.
- [ ] Audio narration per body.
- [ ] Postprocessing bloom (only if perf budget allows).
