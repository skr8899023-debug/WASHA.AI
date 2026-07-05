const ARABIC_FORMATTER = new Intl.NumberFormat("ar-EG");

/** Format a number with Arabic-Indic digits and grouping. */
export function formatArabicNumber(value: number): string {
  return ARABIC_FORMATTER.format(value);
}

/** Compact formatting for large values, e.g. ١٫٤ مليون. */
export function formatArabicCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${ARABIC_FORMATTER.format(roundTo(value / 1_000_000_000, 1))} مليار`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${ARABIC_FORMATTER.format(roundTo(value / 1_000_000, 1))} مليون`;
  }
  return ARABIC_FORMATTER.format(value);
}

function roundTo(value: number, digits: number): number {
  const p = 10 ** digits;
  return Math.round(value * p) / p;
}

export function formatHoursArabic(hours: number): string {
  if (hours >= 48) {
    return `${formatArabicNumber(roundTo(hours / 24, 1))} يوم أرضي`;
  }
  return `${formatArabicNumber(roundTo(hours, 1))} ساعة`;
}

export function formatDaysArabic(days: number): string {
  if (days >= 730) {
    return `${formatArabicNumber(roundTo(days / 365.25, 1))} سنة أرضية`;
  }
  return `${formatArabicNumber(roundTo(days, 1))} يوم أرضي`;
}
