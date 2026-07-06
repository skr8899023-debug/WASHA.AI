# TASKS

## Phase 1 — Plan
- [x] Inspect repo (existing WASHA app; keep its routes)
- [x] SPEC.md / TASKS.md / CONTENT_MODEL.md / CONTENT_SOURCES.md

## Phase 2 — Build
- [x] Install three / r3f / drei / zustand / tajawal
- [x] types.ts + zustand store
- [x] Data: chemistryItems (39), experiments (7), quizzes (16), learningJourneys (9)
- [x] CSS design system (chem.css, RTL, dark glass)
- [x] Layout: ChemistryApp, TopBar (with mode switcher)
- [x] 3D: LabEnvironment, AtomModel, MoleculeModel, ToolModel, FloatingLabel,
      CameraFocusController, ChemistryScene
- [x] Education: KnowledgePanel, ItemBrowser, LessonPanel, ExperimentPanel + ExperimentStage,
      QuizPanel, ComparePanel, SafetyPanel
- [x] Route "/" → chemistry app; keep /design/washa-ai/*; per-route document.title

## Phase 3 — Verify
- [x] `npm run build` (tsc -b + vite) passes
- [x] Playwright e2e: scene loads, select/focus, panels, lessons, experiments, quiz, compare,
      safety, labels toggle, reset view, WASHA route intact
- [x] Console clean (zero errors)

## Phase 4 — Review
- [x] Review vs SPEC.md, update PROGRESS.md, commit + push
