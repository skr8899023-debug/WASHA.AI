import { compoundsList, elementsList, toolsList } from "../../data/chemistryItems";

/** ثابت مواضع العناصر في المشهد ثلاثي الأبعاد، محسوبة مرة واحدة */
export const itemPositions: Record<string, [number, number, number]> = {};

// قوس العناصر في الخلف
elementsList.forEach((el, i) => {
  const t = i / (elementsList.length - 1) - 0.5; // -0.5 .. 0.5
  itemPositions[el.id] = [t * 17, 2.6, -5.5 + Math.abs(t) * 2.2];
});

// صف المركبات في الوسط
compoundsList.forEach((c, i) => {
  const t = i - (compoundsList.length - 1) / 2;
  itemPositions[c.id] = [t * 3.1, 1.7, -0.8];
});

// طاولة الأدوات في المقدمة
toolsList.forEach((tool, i) => {
  const t = i - (toolsList.length - 1) / 2;
  itemPositions[tool.id] = [t * 1.95, 0.78, 3.6];
});

export const DEFAULT_CAMERA_POS: [number, number, number] = [0, 5, 12.5];
export const DEFAULT_TARGET: [number, number, number] = [0, 1.6, 0];
