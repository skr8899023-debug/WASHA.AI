import type { Garment, PrintPosition, ArtStyle, Palette } from "./types";

export const GARMENTS: Garment[] = [
  {
    id: "tshirt",
    label: "تيشيرت قطني",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colors: [
      { id: "ivory", label: "عاجي", hex: "#f2ede3", ink: "light" },
      { id: "black", label: "أسود", hex: "#26231f", ink: "dark" },
      { id: "sand", label: "رملي", hex: "#d9c6a5", ink: "light" },
      { id: "olive", label: "زيتوني", hex: "#6b6b4f", ink: "dark" },
      { id: "brick", label: "طوبي", hex: "#9c5a44", ink: "dark" },
    ],
  },
  {
    id: "hoodie",
    label: "هودي",
    sizes: ["M", "L", "XL", "2XL"],
    colors: [
      { id: "charcoal", label: "فحمي", hex: "#3a3733", ink: "dark" },
      { id: "oat", label: "شوفاني", hex: "#e5dccb", ink: "light" },
      { id: "camel", label: "جملي", hex: "#b08c5f", ink: "dark" },
      { id: "forest", label: "أخضر داكن", hex: "#3f5142", ink: "dark" },
    ],
  },
  {
    id: "sweatshirt",
    label: "سويتشيرت",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { id: "stone", label: "حجري", hex: "#c9c2b4", ink: "light" },
      { id: "cocoa", label: "كاكاو", hex: "#5b4636", ink: "dark" },
      { id: "dusty", label: "وردي مطفي", hex: "#c4a29a", ink: "light" },
    ],
  },
  {
    id: "tote",
    label: "حقيبة قماش",
    sizes: [],
    colors: [
      { id: "natural", label: "طبيعي", hex: "#e8dfc9", ink: "light" },
      { id: "black", label: "أسود", hex: "#2b2823", ink: "dark" },
    ],
  },
];

export const POSITIONS: PrintPosition[] = [
  { id: "chest-full", label: "صدر كامل", hint: "مساحة واسعة للتكوينات الرئيسية" },
  { id: "chest-left", label: "صدر أيسر", hint: "شعار أو عنصر صغير أنيق" },
  { id: "back-full", label: "ظهر كامل", hint: "أكبر مساحة، مناسبة للتفاصيل" },
  { id: "sleeve", label: "الكم", hint: "شريط رفيع أو رمز مصغّر" },
];

export const STYLES: ArtStyle[] = [
  {
    id: "calligraphy",
    label: "خط عربي معاصر",
    hint: "انسيابية الحروف مع لمسة حديثة",
    promptFragment: "بأسلوب الخط العربي المعاصر بحروف انسيابية متوازنة",
  },
  {
    id: "minimal",
    label: "مينيمال",
    hint: "عناصر قليلة ومساحات هادئة",
    promptFragment: "بأسلوب مينيمال بعناصر قليلة وخطوط نظيفة ومساحات فارغة مدروسة",
  },
  {
    id: "geometric",
    label: "هندسي",
    hint: "أشكال حادة وتكرار منظم",
    promptFragment: "بأسلوب هندسي بأشكال حادة وتكوين متكرر منظم",
  },
  {
    id: "handdrawn",
    label: "رسم يدوي",
    hint: "خطوط دافئة بطابع شخصي",
    promptFragment: "بأسلوب الرسم اليدوي بخطوط دافئة غير متكلفة",
  },
  {
    id: "ornament",
    label: "زخرفة إسلامية",
    hint: "تناظر وتفاصيل تراثية",
    promptFragment: "بأسلوب الزخرفة الإسلامية بتناظر دقيق وتفاصيل تراثية",
  },
  {
    id: "boho",
    label: "بوهيمي",
    hint: "دوائر وأقواس بروح حرة",
    promptFragment: "بأسلوب بوهيمي بعناصر عضوية دائرية وروح حرة",
  },
];

export const PALETTES: Palette[] = [
  {
    id: "desert",
    label: "رمال الصحراء",
    colors: ["#c9a36a", "#8c6239", "#e8d9bd", "#5b4636"],
    promptFragment: "بدرجات رملية دافئة وبني عميق",
  },
  {
    id: "oasis",
    label: "واحة خضراء",
    colors: ["#5f7a5a", "#33463a", "#cfd8c3", "#a5803d"],
    promptFragment: "بأخضر واحات هادئ مع لمسة ذهبية",
  },
  {
    id: "ink",
    label: "حبر وورق",
    colors: ["#2e2b27", "#5a554e", "#efe9dd", "#b3aca0"],
    promptFragment: "بتباين الحبر الداكن على الورق العاجي",
  },
  {
    id: "sunset",
    label: "غروب دافئ",
    colors: ["#b3573f", "#d9924f", "#f0dfc8", "#6e3b30"],
    promptFragment: "بدرجات الغروب البرتقالية والطوبية",
  },
  {
    id: "sea",
    label: "بحر هادئ",
    colors: ["#41616d", "#77939c", "#e3e7e2", "#2c3f46"],
    promptFragment: "بأزرق رمادي بحري مطفي",
  },
  {
    id: "royal",
    label: "ذهب ملكي",
    colors: ["#a5803d", "#6e5423", "#f0e6d2", "#35302a"],
    promptFragment: "بذهبي مطفي فاخر على أرضية داكنة",
  },
];

export function garmentById(id: string | null) {
  return GARMENTS.find((g) => g.id === id) ?? null;
}
export function colorById(garment: Garment | null, id: string | null) {
  return garment?.colors.find((c) => c.id === id) ?? null;
}
export function positionById(id: string | null) {
  return POSITIONS.find((p) => p.id === id) ?? null;
}
export function styleById(id: string | null) {
  return STYLES.find((s) => s.id === id) ?? null;
}
export function paletteById(id: string | null) {
  return PALETTES.find((p) => p.id === id) ?? null;
}
