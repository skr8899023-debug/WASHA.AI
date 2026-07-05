import { useSpaceStore } from "../../state/useSpaceStore";
import { SCALE_MODE_LABELS, type ScaleMode } from "../../utils/astronomyTypes";
import { ModeSwitcher } from "./ModeSwitcher";

export function TopBar() {
  const showOrbits = useSpaceStore((s) => s.showOrbits);
  const toggleOrbits = useSpaceStore((s) => s.toggleOrbits);
  const scaleMode = useSpaceStore((s) => s.scaleMode);
  const setScaleMode = useSpaceStore((s) => s.setScaleMode);
  const resetCamera = useSpaceStore((s) => s.resetCamera);
  const setCompareOpen = useSpaceStore((s) => s.setCompareOpen);

  return (
    <header className="top-bar">
      <div className="top-bar-brand">
        <span className="brand-mark" aria-hidden>
          ✦
        </span>
        <div>
          <h1 className="brand-title">أطلس الفضاء التفاعلي</h1>
          <p className="brand-tagline">رحلة تعليمية ثلاثية الأبعاد في النظام الشمسي وما وراءه</p>
        </div>
      </div>

      <ModeSwitcher />

      <div className="top-bar-controls">
        <button type="button" className="btn ghost" onClick={() => setCompareOpen(true)}>
          ⚖ مقارنة
        </button>
        <button
          type="button"
          className={`btn ghost${showOrbits ? " on" : ""}`}
          aria-pressed={showOrbits}
          onClick={toggleOrbits}
        >
          ◌ المدارات
        </button>
        <label className="scale-select">
          <span className="visually-hidden">وضع المقياس</span>
          <select value={scaleMode} onChange={(e) => setScaleMode(e.target.value as ScaleMode)}>
            {(Object.keys(SCALE_MODE_LABELS) as ScaleMode[]).map((m) => (
              <option key={m} value={m}>
                {SCALE_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn ghost" onClick={resetCamera}>
          ⌂ إعادة الكاميرا
        </button>
      </div>
    </header>
  );
}
