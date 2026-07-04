import { garmentById, colorById, positionById, paletteById, styleById } from "../../lib/catalog";
import { Mockup } from "../../components/Mockup";
import type { HistoryItem } from "../../lib/types";
import { useDevStudio } from "../DevStudioContext";
import { ArabicEmptyState } from "./ArabicStates";

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(ts);
}

function Row({ item }: { item: HistoryItem }) {
  const { restoreItem, deleteItem, toggleStar } = useDevStudio();
  const garment = garmentById(item.garment);
  const color = colorById(garment, item.color);
  const position = positionById(item.position);
  const palette = paletteById(item.palette);
  const style = styleById(item.style);

  return (
    <article className={`history-item ${item.starred ? "starred" : ""}`}>
      <div className="thumb" aria-hidden>
        {garment && color && position && palette && (
          <Mockup
            garmentId={garment.id}
            color={color}
            position={position}
            palette={palette}
            styleId={item.style}
            seed={item.seed}
          />
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="h-title">{item.prompt || "بدون وصف"}</p>
        <p className="h-meta">
          {garment?.label} · {color?.label} · {style?.label}
        </p>
        <p className="h-meta">{formatDate(item.createdAt)}</p>
        <div className="h-actions">
          <button className="btn btn-sm btn-primary" onClick={() => restoreItem(item)}>
            استرجاع
          </button>
          <button
            className="btn btn-sm"
            onClick={() => toggleStar(item.id)}
            aria-pressed={item.starred}
            title={item.starred ? "إزالة علامة الأفضل" : "تعليم كالأفضل"}
          >
            {item.starred ? "★ الأفضل" : "☆ الأفضل"}
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => deleteItem(item.id)}>
            حذف
          </button>
        </div>
      </div>
    </article>
  );
}

export function DesignHistoryDrawer() {
  const { state, patch } = useDevStudio();
  if (!state.historyOpen) return null;

  const close = () => patch({ historyOpen: false });

  return (
    <>
      <div className="drawer-scrim" onClick={close} aria-hidden />
      <aside className="history-drawer" role="dialog" aria-label="سجل التصاميم" aria-modal="true">
        <header>
          <h3>سجل التصاميم</h3>
          <button className="btn btn-sm btn-ghost" onClick={close} aria-label="إغلاق السجل">
            إغلاق
          </button>
        </header>
        <div className="history-list">
          {state.history.length === 0 ? (
            <ArabicEmptyState
              title="السجل فارغ"
              body="بعد توليد تصميم، احفظه ليظهر هنا وتتمكن من استرجاعه أو مقارنته لاحقًا."
            />
          ) : (
            state.history.map((item) => <Row key={item.id} item={item} />)
          )}
        </div>
      </aside>
    </>
  );
}
