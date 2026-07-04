import type { FailureMode, GenerationErrorCode, GenerationErrorInfo } from "./types";

export const PROVIDERS = ["WASHA Render A", "WASHA Render B"] as const;

export class GenerationError extends Error {
  info: GenerationErrorInfo;
  constructor(info: GenerationErrorInfo) {
    super(info.message);
    this.name = "GenerationError";
    this.info = info;
  }
}

const ERROR_COPY: Record<GenerationErrorCode, GenerationErrorInfo> = {
  quota: {
    code: "quota",
    message: "تعذّر التوليد بسبب حد الاستخدام.",
    action: "انتظر قليلًا ثم أعد المحاولة، أو جرّب لاحقًا.",
  },
  busy: {
    code: "busy",
    message: "الخادم مشغول الآن.",
    action: "أعد المحاولة خلال لحظات، سيتم التبديل لمزوّد بديل تلقائيًا.",
  },
  payload: {
    code: "payload",
    message: "الصورة المرجعية كبيرة جدًا.",
    action: "قلّل حجم الوصف أو المرجع ثم أعد المحاولة.",
  },
  unknown: {
    code: "unknown",
    message: "حدث خطأ غير متوقع أثناء التوليد.",
    action: "أعد المحاولة، وإذا تكرر الخطأ راجع لوحة التشخيص.",
  },
};

export function errorInfo(code: GenerationErrorCode): GenerationErrorInfo {
  return ERROR_COPY[code];
}

/** Deterministic 32-bit hash so the same prompt re-renders the same design. */
export function hashSeed(text: string, variant = 0): number {
  let h = 2166136261 ^ variant;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface GenerateOptions {
  prompt: string;
  variant: number;
  failureMode: FailureMode;
  /** index into PROVIDERS; busy errors flip to the fallback on retry */
  providerIndex: number;
}

export interface GenerateResult {
  seed: number;
  provider: string;
  duration: number;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Simulated generation provider for the dev lab. Real image APIs plug in
 * behind this exact contract later; the UI only depends on this shape.
 */
export async function generateDesign(opts: GenerateOptions): Promise<GenerateResult> {
  const started = performance.now();
  const provider = PROVIDERS[opts.providerIndex % PROVIDERS.length];
  await wait(1400 + Math.random() * 1400);

  let forced: GenerationErrorCode | null = null;
  if (opts.failureMode === "quota" || opts.failureMode === "busy" || opts.failureMode === "payload") {
    forced = opts.failureMode;
  } else if (opts.failureMode === "random" && Math.random() < 0.35) {
    forced = (["quota", "busy", "unknown"] as const)[Math.floor(Math.random() * 3)];
  }
  if (forced) {
    throw new GenerationError(ERROR_COPY[forced]);
  }

  return {
    seed: hashSeed(opts.prompt, opts.variant),
    provider,
    duration: Math.round(performance.now() - started),
  };
}
