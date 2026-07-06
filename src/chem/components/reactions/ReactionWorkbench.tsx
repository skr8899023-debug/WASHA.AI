import { useMemo, useState } from "react";
import { chemicalsById } from "../../data/chemicals";
import { evaluateReaction } from "../../reactions/reactionEngine";
import { MixingScene } from "../three/MixingScene";
import { ChemicalShelf } from "./ChemicalShelf";
import { ReactionResultPanel } from "./ReactionResultPanel";
import { ReactionSafetyPanel } from "./ReactionSafetyPanel";

const MAX_CONTENTS = 3;

/** منطقة التفاعلات الكيميائية — منضدة تفاعل تفاعلية مقادة بالبيانات */
export function ReactionWorkbench() {
  const [contents, setContents] = useState<string[]>([]);
  const [heat, setHeat] = useState(false);
  const [stir, setStir] = useState(false);
  const [pourKey, setPourKey] = useState(0);
  const [pourColor, setPourColor] = useState("#bfe8ff");

  const result = useMemo(() => evaluateReaction(contents, { heat, stir }), [contents, heat, stir]);

  const addChemical = (id: string) => {
    setContents((prev) => {
      if (prev.includes(id) || prev.length >= MAX_CONTENTS) return prev;
      return [...prev, id];
    });
    setPourColor(chemicalsById[id]?.color ?? "#bfe8ff");
    setPourKey((k) => k + 1);
  };

  const removeChemical = (id: string) => setContents((prev) => prev.filter((x) => x !== id));

  const reset = () => {
    setContents([]);
    setHeat(false);
    setStir(false);
  };

  return (
    <div className="chem-page rxn-page">
      <div className="rxn-layout">
        <ChemicalShelf contents={contents} full={contents.length >= MAX_CONTENTS} onAdd={addChemical} />

        <div className="rxn-stage-col">
          <div className="rxn-stage">
            <MixingScene visual={result.visual} stir={stir} heat={heat} pourKey={pourKey} pourColor={pourColor} />
            <div className="rxn-stage-badge">منطقة التفاعلات الكيميائية</div>
          </div>

          <div className="rxn-contents">
            <span className="rxn-contents-label">في الكأس:</span>
            {contents.length === 0 ? (
              <span className="rxn-empty">الكأس فارغ — اختر مادة من الرف</span>
            ) : (
              contents.map((id) => (
                <button key={id} className="rxn-content-chip" onClick={() => removeChemical(id)} aria-label={`أزل ${chemicalsById[id].arabicName}`}>
                  <span className="rxn-chip-dot" style={{ background: chemicalsById[id].color }} />
                  {chemicalsById[id].arabicName}
                  <span className="rxn-chip-x">✕</span>
                </button>
              ))
            )}
          </div>

          <div className="rxn-controls">
            <button className={`rxn-tool ${heat ? "on" : ""}`} onClick={() => setHeat((h) => !h)}>
              🔥 <span>{heat ? "الموقد يعمل" : "تسخين"}</span>
            </button>
            <button className={`rxn-tool ${stir ? "on" : ""}`} onClick={() => setStir((s) => !s)}>
              🥄 <span>{stir ? "يتم التحريك" : "تحريك"}</span>
            </button>
            <button className="rxn-tool danger" onClick={reset}>
              🧽 <span>تفريغ الكأس</span>
            </button>
          </div>
        </div>

        <div className="rxn-side">
          <ReactionResultPanel result={result} />
          <ReactionSafetyPanel />
        </div>
      </div>
    </div>
  );
}
