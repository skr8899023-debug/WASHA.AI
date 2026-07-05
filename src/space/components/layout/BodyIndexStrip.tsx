import { CELESTIAL_BODIES } from "../../data/celestialBodies";
import { useSpaceStore } from "../../state/useSpaceStore";

/** Horizontal chip index of all bodies — quick classroom navigation. */
export function BodyIndexStrip() {
  const selectedBodyId = useSpaceStore((s) => s.selectedBodyId);
  const selectBody = useSpaceStore((s) => s.selectBody);

  return (
    <nav className="body-strip" aria-label="دليل الأجرام">
      {CELESTIAL_BODIES.map((b) => (
        <button
          key={b.id}
          type="button"
          className={`body-chip${selectedBodyId === b.id ? " active" : ""}`}
          onClick={() => selectBody(b.id)}
        >
          {b.arabicName}
        </button>
      ))}
    </nav>
  );
}
