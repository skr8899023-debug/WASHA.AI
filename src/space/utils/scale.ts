import type { ScaleMode, VisualConfig } from "./astronomyTypes";

/**
 * Educational scale presets. None of them are true-to-scale distances —
 * the UI labels this explicitly. They trade off recognisability vs realism.
 */
export function bodyRadius(visual: VisualConfig, mode: ScaleMode): number {
  switch (mode) {
    case "approx":
      // Compress size differences less: big bodies noticeably bigger.
      return visual.radius * (visual.kind === "star" ? 1.35 : 1.15);
    case "simplified":
      // Flatten differences so small bodies stay tappable on mobile.
      return 0.55 + visual.radius * 0.6;
    case "teaching":
    default:
      return visual.radius;
  }
}

export function orbitRadius(visual: VisualConfig, mode: ScaleMode): number {
  const base = visual.orbitRadius ?? 0;
  if (mode === "simplified") return base * 0.9;
  return base;
}
