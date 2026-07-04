import type { Garment, GarmentColor, PrintPosition, ArtStyle, Palette } from "./types";

export type QualityLevel = "needs-detail" | "clear" | "ready";

export interface PromptQuality {
  level: QualityLevel;
  label: string;
  tips: string[];
}

const DETAIL_HINTS = [
  /لون|ألوان|ذهبي|أسود|أبيض|أخضر|أزرق|أحمر|بني/,
  /خلفية|أرضية|فارغ/,
  /كبير|صغير|وسط|أعلى|أسفل|دائري|مربع/,
  /خط|زخرفة|رسم|هندسي|مينيمال|بوهيمي|كاليغرافي/,
];

/** Rule-based quality meter over the raw Arabic idea. */
export function promptQuality(raw: string): PromptQuality {
  const words = raw.trim().split(/\s+/).filter(Boolean);
  const hits = DETAIL_HINTS.filter((r) => r.test(raw)).length;

  if (words.length < 4) {
    return {
      level: "needs-detail",
      label: "يحتاج تفاصيل",
      tips: [
        "صف العنصر الرئيسي في التصميم",
        "أضف كلمة أو عبارة إن أردت نصًا مطبوعًا",
        "اذكر الإحساس العام: هادئ، جريء، تراثي…",
      ],
    };
  }
  if (words.length < 10 || hits < 2) {
    return {
      level: "clear",
      label: "واضح",
      tips: [
        hits < 1 ? "اذكر الألوان أو الإحساس اللوني المفضل" : "",
        "حدد حجم العنصر: كبير في المنتصف أم رمز صغير؟",
      ].filter(Boolean),
    };
  }
  return { level: "ready", label: "جاهز للتوليد", tips: [] };
}

export interface ImproveInput {
  raw: string;
  garment: Garment;
  color: GarmentColor;
  size: string | null;
  position: PrintPosition;
  style: ArtStyle;
  palette: Palette;
}

/**
 * Deterministic Arabic prompt builder: keeps the user's idea verbatim and
 * layers garment, position, art direction, palette, composition and DTF
 * print-readiness constraints around it.
 */
export function improvePrompt(input: ImproveInput): string {
  const { raw, garment, color, position, style, palette } = input;
  const base = color.ink === "dark" ? "قاعدة داكنة" : "قاعدة فاتحة";
  return [
    `تصميم طباعة DTF على ${garment.label} بلون ${color.label} (${base}).`,
    `الفكرة: ${raw.trim()}`,
    `موضع الطباعة: ${position.label} — ${position.hint}.`,
    `الاتجاه الفني: ${style.promptFragment}.`,
    `لوحة الألوان: ${palette.label} ${palette.promptFragment}.`,
    `التكوين: عنصر رئيسي واضح في مركز مساحة الطباعة، توازن بصري، وهوامش آمنة حول الحواف.`,
    `جاهزية الطباعة: خلفية شفافة تمامًا، حواف نظيفة، وخطوط لا تقل عن 1.5 ملم.`,
    `قيود DTF: ألوان مفصولة بوضوح، تجنّب التدرجات الشفافة الناعمة والتفاصيل الأدق من قدرة الطباعة، دقة 300DPI.`,
  ].join("\n");
}
