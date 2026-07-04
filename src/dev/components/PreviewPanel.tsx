import { Mockup } from "../../components/Mockup";
import { garmentById, colorById, positionById, paletteById, styleById } from "../../lib/catalog";
import type { HistoryItem } from "../../lib/types";
import { useDevStudio } from "../DevStudioContext";

function HistoryMockup({ item }: { item: HistoryItem }) {
  const garment = garmentById(item.garment);
  const color = colorById(garment, item.color);
  const position = positionById(item.position);
  const palette = paletteById(item.palette);
  if (!garment || !color || !position || !palette) return null;
  return (
    <Mockup
      garmentId={garment.id}
      color={color}
      position={position}
      palette={palette}
      styleId={item.style}
      seed={item.seed}
    />
  );
}

export function PreviewPanel() {
  const { state, bestItem, previousItem } = useDevStudio();
  const garment = garmentById(state.garmentId);
  const color = colorById(garment, state.colorId);
  const position = positionById(state.positionId);
  const palette = paletteById(state.paletteId);
  const style = styleById(state.styleId);

  const canPreview = garment && color && position && palette && style;

  return (
    <section className="panel preview-panel" aria-labelledby="preview-title">
      <h3 className="panel-title" id="preview-title">
        المعاينة
      </h3>

      {state.status === "loading" ? (
        <div className="loading-shape" style={{ width: "100%", aspectRatio: "1 / 1" }} aria-label="جارٍ التحضير" />
      ) : canPreview && state.current ? (
        <div className="mockup-frame">
          <div className="mockup-swap" key={state.current.seed}>
            <Mockup
              garmentId={garment.id}
              color={color}
              position={position}
              palette={palette}
              styleId={style.id}
              seed={state.current.seed}
            />
          </div>
        </div>
      ) : (
        <div className="mockup-frame" style={{ display: "grid", placeItems: "center", aspectRatio: "1 / 1" }}>
          <p style={{ fontSize: 13, color: "var(--text-soft)", padding: 16, textAlign: "center" }}>
            {canPreview
              ? "ولّد التصميم لعرض المعاينة هنا."
              : "أكمل الخطوات لعرض المعاينة على القطعة."}
          </p>
        </div>
      )}

      <div className="preview-meta">
        {garment && <span className="meta-chip">{garment.label}</span>}
        {color && <span className="meta-chip">{color.label}</span>}
        {state.size && <span className="meta-chip">مقاس {state.size}</span>}
        {position && <span className="meta-chip">{position.label}</span>}
        {style && <span className="meta-chip">{style.label}</span>}
        {palette && <span className="meta-chip">{palette.label}</span>}
      </div>

      {state.compareOpen && (
        <div style={{ marginTop: 14 }}>
          <h4 style={{ fontSize: 13, marginBottom: 8 }}>مقارنة النتائج</h4>
          <div className="compare-grid">
            <div className="compare-cell">
              <h4>الحالي</h4>
              {canPreview && state.current ? (
                <Mockup
                  garmentId={garment.id}
                  color={color}
                  position={position}
                  palette={palette}
                  styleId={style.id}
                  seed={state.current.seed}
                />
              ) : (
                <div className="empty-slot">لا يوجد تصميم حالي</div>
              )}
            </div>
            <div className="compare-cell">
              <h4>السابق</h4>
              {previousItem ? <HistoryMockup item={previousItem} /> : <div className="empty-slot">لا يوجد تصميم سابق</div>}
            </div>
            <div className="compare-cell">
              <h4>الأفضل</h4>
              {bestItem ? (
                <HistoryMockup item={bestItem} />
              ) : (
                <div className="empty-slot">علّم تصميمًا بنجمة من السجل ليظهر هنا</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
