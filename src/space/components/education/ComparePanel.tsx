import { useMemo } from "react";
import { CELESTIAL_BODIES, BODY_BY_ID } from "../../data/celestialBodies";
import { useSpaceStore } from "../../state/useSpaceStore";
import {
  formatArabicCompact,
  formatArabicNumber,
  formatDaysArabic,
  formatHoursArabic,
} from "../../utils/formatArabicNumber";
import type { CelestialBody } from "../../utils/astronomyTypes";

/** True when a body has at least one numeric metric worth comparing. */
export function isComparableBody(b: CelestialBody): boolean {
  return (
    !!b.metrics &&
    (b.metrics.diameterKm !== undefined ||
      b.metrics.distanceFromSunAU !== undefined ||
      b.metrics.dayLengthHours !== undefined ||
      b.metrics.yearLengthDays !== undefined)
  );
}

const COMPARABLE = CELESTIAL_BODIES.filter(isComparableBody);

interface MetricDef {
  key: string;
  label: string;
  value: (b: CelestialBody) => number | undefined;
  format: (v: number) => string;
  note?: (b: CelestialBody) => string | undefined;
}

const METRICS: MetricDef[] = [
  {
    key: "diameter",
    label: "القطر",
    value: (b) => b.metrics?.diameterKm,
    format: (v) => (v >= 1 ? `${formatArabicCompact(v)} كم` : `${formatArabicNumber(Math.round(v * 1000))} متر`),
  },
  {
    key: "distance",
    label: "البعد عن الشمس",
    value: (b) => (b.metrics?.distanceFromSunAU && b.metrics.distanceFromSunAU > 0 ? b.metrics.distanceFromSunAU : undefined),
    format: (v) => `${formatArabicNumber(v)} وحدة فلكية`,
  },
  {
    key: "day",
    label: "مدة اليوم (الدوران المحوري)",
    value: (b) => b.metrics?.dayLengthHours,
    format: formatHoursArabic,
  },
  {
    key: "year",
    label: "مدة السنة (الدورة حول الشمس)",
    value: (b) => b.metrics?.yearLengthDays,
    format: formatDaysArabic,
  },
  {
    key: "moons",
    label: "عدد الأقمار",
    value: (b) => (typeof b.metrics?.moonCount === "number" ? b.metrics.moonCount : undefined),
    format: (v) => formatArabicNumber(v),
    note: (b) => (b.metrics?.moonCount === "variable" ? b.metrics.moonCountNote : undefined),
  },
];

/** Log-ish share of the pair max, kept ≥ 4% so tiny values stay visible. */
function barShare(value: number, max: number): number {
  if (max <= 0) return 0;
  const share = Math.log10(1 + value * 9 / max) / Math.log10(10); // 0..1, log curve
  return Math.max(4, Math.round(share * 100));
}

export function ComparePanel() {
  const compareOpen = useSpaceStore((s) => s.compareOpen);
  const compareA = useSpaceStore((s) => s.compareA);
  const compareB = useSpaceStore((s) => s.compareB);
  const setCompare = useSpaceStore((s) => s.setCompare);
  const setCompareOpen = useSpaceStore((s) => s.setCompareOpen);

  const bodyA = compareA ? BODY_BY_ID[compareA] : null;
  const bodyB = compareB ? BODY_BY_ID[compareB] : null;

  const rows = useMemo(() => {
    if (!bodyA || !bodyB) return [];
    return METRICS.map((metric) => {
      const va = metric.value(bodyA);
      const vb = metric.value(bodyB);
      const noteA = metric.note?.(bodyA);
      const noteB = metric.note?.(bodyB);
      if (va === undefined && vb === undefined && !noteA && !noteB) return null;
      const max = Math.max(va ?? 0, vb ?? 0);
      return {
        metric,
        a: va !== undefined ? { value: metric.format(va), share: barShare(va, max) } : noteA ? { value: noteA, share: 0 } : null,
        b: vb !== undefined ? { value: metric.format(vb), share: barShare(vb, max) } : noteB ? { value: noteB, share: 0 } : null,
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);
  }, [bodyA, bodyB]);

  if (!compareOpen) return null;

  return (
    <div className="compare-overlay" role="dialog" aria-label="مقارنة بين جرمين" onClick={() => setCompareOpen(false)}>
      <div className="compare-panel" onClick={(e) => e.stopPropagation()}>
        <header className="compare-header">
          <h2 className="panel-title">مقارنة بين جرمين</h2>
          <button type="button" className="icon-btn" aria-label="إغلاق المقارنة" onClick={() => setCompareOpen(false)}>
            ✕
          </button>
        </header>

        <div className="compare-selects">
          <label>
            الجرم الأول
            <select value={compareA ?? ""} onChange={(e) => setCompare("a", e.target.value || null)}>
              {COMPARABLE.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.arabicName}
                </option>
              ))}
            </select>
          </label>
          <span className="compare-vs">مقابل</span>
          <label>
            الجرم الثاني
            <select value={compareB ?? ""} onChange={(e) => setCompare("b", e.target.value || null)}>
              {COMPARABLE.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.arabicName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {bodyA && bodyB && (
          <div className="compare-rows">
            {rows.map(({ metric, a, b }) => (
              <div className="compare-row" key={metric.key}>
                <div className="compare-metric-label">{metric.label}</div>
                <CompareBar name={bodyA.arabicName} entry={a} tone="a" />
                <CompareBar name={bodyB.arabicName} entry={b} tone="b" />
              </div>
            ))}
            <div className="compare-notes">
              <SurfaceNote body={bodyA} />
              <SurfaceNote body={bodyB} />
            </div>
          </div>
        )}
        <p className="compare-hint">الأشرطة تمثل نسبًا مبسطة للمقارنة التعليمية، وليست مقياسًا هندسيًا دقيقًا.</p>
      </div>
    </div>
  );
}

function CompareBar({
  name,
  entry,
  tone,
}: {
  name: string;
  entry: { value: string; share: number } | null;
  tone: "a" | "b";
}) {
  return (
    <div className={`compare-bar-row ${tone}`}>
      <span className="compare-bar-name">{name}</span>
      <div className="compare-bar-track">
        {entry && entry.share > 0 && <div className="compare-bar-fill" style={{ width: `${entry.share}%` }} />}
      </div>
      <span className="compare-bar-value">{entry ? entry.value : "غير متاح"}</span>
    </div>
  );
}

function SurfaceNote({ body }: { body: CelestialBody }) {
  const note = body.metrics?.tempNote ?? body.metrics?.surfaceNote;
  if (!note) return null;
  return (
    <div className="compare-note">
      <strong>{body.arabicName}:</strong> {note}
    </div>
  );
}
