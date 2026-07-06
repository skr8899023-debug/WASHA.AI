import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/tajawal/800.css";
import "./styles/chem.css";
import { TopBar } from "./components/layout/TopBar";
import { ChemistryScene } from "./components/three/ChemistryScene";
import { KnowledgePanel } from "./components/education/KnowledgePanel";
import { ItemBrowser } from "./components/education/ItemBrowser";
import { LessonPanel } from "./components/education/LessonPanel";
import { ExperimentPanel } from "./components/education/ExperimentPanel";
import { QuizPanel } from "./components/education/QuizPanel";
import { ComparePanel } from "./components/education/ComparePanel";
import { SafetyPanel } from "./components/education/SafetyPanel";
import { useChemistryStore } from "./state/useChemistryStore";

export default function ChemistryApp() {
  const mode = useChemistryStore((s) => s.mode);

  return (
    <div className="chem-app" dir="rtl" lang="ar">
      <TopBar />
      <main className="chem-main">
        {/* المشهد ثلاثي الأبعاد يبقى حيًّا دائمًا ليحافظ على موضع الكاميرا */}
        <div className="chem-canvas-wrap" style={{ visibility: mode === "explore" ? "visible" : "hidden" }}>
          <ChemistryScene />
        </div>

        {mode === "explore" && (
          <>
            <ItemBrowser />
            <KnowledgePanel />
            <div className="chem-hint">🖱 اسحب للدوران • عجلة الفأرة للتقريب • انقر أي عنصر لاستكشافه</div>
          </>
        )}
        {mode === "learn" && <LessonPanel />}
        {mode === "experiments" && <ExperimentPanel />}
        {mode === "quiz" && <QuizPanel />}
        {mode === "compare" && <ComparePanel />}
        {mode === "safety" && <SafetyPanel />}
      </main>
    </div>
  );
}
