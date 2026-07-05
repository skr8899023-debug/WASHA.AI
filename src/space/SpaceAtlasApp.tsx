import { useEffect } from "react";
import { SpaceScene } from "./components/three/SpaceScene";
import { TopBar } from "./components/layout/TopBar";
import { BodyIndexStrip } from "./components/layout/BodyIndexStrip";
import { KnowledgePanel } from "./components/education/KnowledgePanel";
import { GuidedJourneyPanel } from "./components/education/GuidedJourneyPanel";
import { QuizPanel } from "./components/education/QuizPanel";
import { ComparePanel } from "./components/education/ComparePanel";
import { useSpaceStore } from "./state/useSpaceStore";
import "./styles/space.css";

export function SpaceAtlasApp() {
  const mode = useSpaceStore((s) => s.mode);
  const selectedBodyId = useSpaceStore((s) => s.selectedBodyId);
  const activeJourneyId = useSpaceStore((s) => s.activeJourneyId);

  useEffect(() => {
    document.title = "أطلس الفضاء التفاعلي";
  }, []);

  const showKnowledge =
    selectedBodyId !== null &&
    (mode === "explore" || (mode === "learn" && !activeJourneyId));

  return (
    <div className="space-app" dir="rtl">
      <div className="space-scene-layer">
        <SpaceScene />
      </div>

      <TopBar />

      {showKnowledge && <KnowledgePanel />}
      {mode === "learn" && <GuidedJourneyPanel />}
      {mode === "quiz" && <QuizPanel />}
      <ComparePanel />

      {mode === "explore" && <BodyIndexStrip />}

      <div className="scale-disclaimer">الأحجام والمسافات تعليمية مبسطة وليست بمقياس حقيقي</div>
    </div>
  );
}
