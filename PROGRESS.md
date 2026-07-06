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

## Known limitations / future ideas
- Chemistry chunk is ~948 kB minified (three.js); it is lazy-loaded so WASHA routes don't pay
  for it. Could split further if needed.
- Concepts are sidebar-only (no 3D mesh) by design.
- Sidebar browser hidden below 760 px width; scene + panels remain usable on mobile.
- Possible next steps: sound effects, saved quiz history (localStorage), teacher mode, more
  elements/experiments — data files are ready for extension.
