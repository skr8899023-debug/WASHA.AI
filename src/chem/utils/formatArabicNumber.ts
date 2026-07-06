const arabicFormatter = new Intl.NumberFormat("ar-EG");

/** يعرض الأرقام بأرقام عربية مشرقية (١٢٣) */
export function formatArabicNumber(n: number): string {
  return arabicFormatter.format(n);
}
