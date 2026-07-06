# PROGRESS — مختبر الكيمياء التفاعلي

**Status: COMPLETE ✅** (2026-07-06)

## What was built
Arabic-first RTL 3D chemistry learning lab, served at `/` (existing WASHA studio untouched at
`/design/washa-ai/app|dev`). Stack: Vite + React 18 + TS + three.js + R3F v8 + drei v9 + zustand,
self-hosted Tajawal font, plain CSS.

### Modules (all functional)
- **استكشف** — 3D lab: 10 Bohr-model atoms (animated electron shells) on a back arc, 7
  ball-and-stick molecules mid-row, 9 procedural lab tools on a front bench (incl. flickering
  burner flame). Hover Arabic labels, click → damped camera focus, sidebar browser with category
  filters (39 items incl. 13 concepts), labels toggle, reset view, ambient particles + Sparkles.
- **Knowledge panel** — all spec sections: ما هو؟ / لماذا مهم؟ / خصائص / مثال من الحياة / خطأ شائع
  / سؤال تفكير / تجارب مرتبطة (deep-link) / سلامة / مصادر / آخر مراجعة.
- **تعلّم** — 9 guided journeys × 5 steps, progress bar, tips, deep-links into the 3D lab.
- **التجارب** — 7 step-by-step simulations on an animated SVG stage (liquid, particles, bubbles,
  flame, floating substance badges, live pH scale): تكوين الماء، إذابة الملح، حمض+قاعدة، اختبار
  pH، فصل مخلوط، الاحتراق، فيزيائي/كيميائي.
- **اختبر نفسك** — 10 random questions from a 16-question bank, immediate feedback, explanations,
  Arabic-numeral score, restart.
- **قارن** — 7 preset pairs + free selection of any two of the 39 items, 7-row side-by-side table.
- **السلامة** — 6 safety cards (deep-link to lab items) + القواعد الذهبية الست.

## Verification (all passed)
- `npm run build` (tsc -b + vite build) — clean.
- Playwright end-to-end against `vite preview`: canvas loads, sidebar selection → knowledge panel,
  related-experiment deep-link, experiment step-through/conclusion/reset, lesson navigation,
  lesson→lab deep-link, quiz answer/explanation/next, compare preset, safety section, labels
  toggle + reset view, WASHA route intact, **zero console errors**.
- Screenshots reviewed: default lab view, focused molecule view, neutralization experiment at
  pH 7 — visual quality matches SPEC direction.

## Quality review pass (2026-07-06)
Strict review against Arabic UX, scientific correctness, learning value, visuals, 3D
interactivity, lessons, experiments, quiz, build, and performance. Issues found and fixed:

1. **Scientific correctness** — gold's electron shells were `[2,8,18,18]` (46 e⁻); corrected to
   the real configuration `[2,8,18,32,18,1]` (79 e⁻).
2. **Performance** — the 3D canvas kept its render loop running while hidden behind other modes;
   now `frameloop="never"` outside استكشف, resuming automatically on return.
3. **3D interactivity** — the "التسميات" toggle only hid the selected item's label; now it
   controls hover labels too, so the toggle has clear, observable behavior.
4. **UI quality** — knowledge-panel badge for lab tools fell back to English letter fragments
   ("Be", "Te"); added `TOOL_ICONS`/`itemBadge()` so tools show proper icons in the badge and
   the sidebar browser.
5. **Feedback semantics** — correct quiz answers now use an emerald success callout
   (`.chem-callout.ok`) instead of the violet "thinking" style.
6. **Docs** — README updated to document all three routes (chemistry lab at `/` + WASHA routes).

Re-verified after fixes: `npm run build` clean; full Playwright e2e suite (13 checks) passed
with zero console errors.

## Module added: منطقة التفاعلات الكيميائية (2026-07-06)
New premium mode `reactions` in the existing app (no rebuild). An immersive Arabic RTL 3D
reaction workbench, fully data-driven.

- **3D mixing scene** (`components/three/MixingScene.tsx`): glass beaker with animated liquid
  level + smooth color blending (damped lerp), rising bubbles, foam, settling precipitate
  particles, steam/vapor puffs, stir rod + swirl, burner flame + glow on heat, pour stream on
  add, premium multi-light rig, auto-orbit camera. Own Canvas, mounted only in this mode.
- **Reaction engine** (`reactions/reactionEngine.ts`): matches the current chemical set +
  conditions (heat/stir) against the reaction table, prefers the most condition-specific match,
  and falls back to explained "no reaction / non-reacting mixture" outcomes. Color blending for
  pre-reaction mixtures.
- **Data-driven content**: `data/chemicals.ts` (10 safe classroom chemicals) and
  `data/reactions.ts` (13 seeded reactions). Outcomes cover none, color, gas, precipitate,
  pH shift, temp change, dissolution, crystallization, neutralization, evaporation, physical.
  Every result answers the six Arabic questions (ماذا/لماذا/النوع/الدليل/المعادلة/السلامة).
- **UI** (`components/reactions/`): `ChemicalShelf` (click to pour), `ReactionWorkbench`
  (state + layout + heat/stir/clear + contents chips), `ReactionResultPanel` (six-section result
  + pH bar + "عرض تعليمي فقط" badge), `ReactionSafetyPanel`.
- **Seeded reactions**: حمض+قاعدة (تعادل)، حمض/خل+كربونات (غاز)، نترات الفضة+كلوريد الصوديوم
  (راسب)، ملح+ماء (ذوبان، وتبلور عند التسخين)، الكاشف مع حمض/قاعدة/ماء (تغيّر لوني + pH)،
  أكسدة الحديد (عرض تعليمي فقط)، تسخين الماء (تبخّر)، وزيت+ماء (لا تفاعل).
- **Safety**: only diluted/safe classroom quantities; no hazardous synthesis or procedural
  recipes; slow/unsafe-to-run reactions (rusting) are conceptual and labelled «عرض تعليمي فقط».

Verified: `npm run build` clean; Playwright e2e extended with three reaction flows
(acid+base neutralization, water+heat evaporation, oil+water non-reacting) — full suite (16
checks) passes with zero console errors.

## Known limitations / future ideas
- Chemistry chunk is ~948 kB minified (three.js); it is lazy-loaded so WASHA routes don't pay
  for it. Could split further if needed.
- Concepts are sidebar-only (no 3D mesh) by design.
- Sidebar browser hidden below 760 px width; scene + panels remain usable on mobile.
- Possible next steps: sound effects, saved quiz history (localStorage), teacher mode, more
  elements/experiments — data files are ready for extension.
