# WASHA AI — استوديو التصميم

Arabic-first DTF apparel design studio. Two routes ship from one SPA:

| Route | What it is |
| --- | --- |
| `/design/washa-ai/app` | Production studio — stable, simple flow |
| `/design/washa-ai/dev` | Dev Studio — the design lab for testing the six-step flow |

## Run locally

```bash
npm install
npm run dev
```

Then open:

- Production: http://localhost:5173/design/washa-ai/app
- Dev Studio: http://localhost:5173/design/washa-ai/dev

`npm run build` type-checks and produces `dist/`; `npm run preview` serves the build.

## Dev Studio overview

Six Arabic RTL steps: garment → idea → print position → art style → palette →
generate & review. Before generation the raw Arabic idea is expanded into an
improved prompt (garment, position, art direction, palette, composition, DTF
constraints) shown side-by-side with the original — the user approves or edits
it, nothing is overwritten silently.

- **Prompt quality meter**: يحتاج تفاصيل / واضح / جاهز للتوليد.
- **Compare mode**: current vs. previous vs. best (starred) mockup.
- **Local history** (`localStorage`, key `washa-dev-history-v1`): every saved
  design keeps prompt, improvedPrompt, garment, color, size, position, style,
  palette, provider, duration, seed, createdAt — enough to re-render the
  mockup deterministically and restore or delete it.
- **Provider simulation**: generation is mocked behind the contract in
  `src/lib/generation.ts` (seeded, deterministic mockups). Provider-aware
  Arabic errors (quota / busy / payload) can be forced from the diagnostics
  panel (`failure.mode`); a busy provider flips to the fallback on retry.
- **Diagnostics panel** (bottom corner, English/monospace by design):
  step, selections, prompt lengths, provider, status, duration, last error,
  history count, seed.

## Structure

```
src/
  App.tsx                  # route detection (app ↔ dev)
  lib/                     # catalog, prompt builder, generation, history
  components/Mockup.tsx    # seeded SVG garment mockup renderer
  prod/WashaProductionStudio.tsx
  dev/
    WashaDevStudio.tsx     # composition root
    DevStudioContext.tsx   # reducer + orchestration
    components/            # header, stepper, steps, panels, drawer, states
```

Swapping the mock generator for a real image API only requires implementing
`generateDesign()` in `src/lib/generation.ts` — the UI depends solely on that
contract.
