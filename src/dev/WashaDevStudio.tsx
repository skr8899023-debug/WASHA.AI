import { DevStudioProvider, useDevStudio } from "./DevStudioContext";
import { DevStudioHeader } from "./components/DevStudioHeader";
import { DevStepper } from "./components/DevStepper";
import { GarmentDevStep } from "./components/steps/GarmentDevStep";
import { IdeaDevStep } from "./components/steps/IdeaDevStep";
import { PositionDevStep } from "./components/steps/PositionDevStep";
import { StyleDevStep } from "./components/steps/StyleDevStep";
import { PaletteDevStep } from "./components/steps/PaletteDevStep";
import { ResultDevStep } from "./components/steps/ResultDevStep";
import { PreviewPanel } from "./components/PreviewPanel";
import { ProviderStatusPanel } from "./components/ProviderStatusPanel";
import { DesignHistoryDrawer } from "./components/DesignHistoryDrawer";
import { DevDiagnosticsPanel } from "./components/DevDiagnosticsPanel";

const STEP_COMPONENTS = [
  GarmentDevStep,
  IdeaDevStep,
  PositionDevStep,
  StyleDevStep,
  PaletteDevStep,
  ResultDevStep,
];

function StudioBody() {
  const { state } = useDevStudio();
  const Step = STEP_COMPONENTS[state.step] ?? GarmentDevStep;

  return (
    <div className="studio-shell">
      <DevStudioHeader />
      <main className="studio-main">
        <div className="studio-col-flow">
          <DevStepper />
          {/* key forces the enter animation on step change */}
          <div key={state.step}>
            <Step />
          </div>
        </div>
        <div className="studio-col-side">
          <PreviewPanel />
          <ProviderStatusPanel />
        </div>
      </main>
      <DesignHistoryDrawer />
      <DevDiagnosticsPanel />
    </div>
  );
}

export function WashaDevStudio() {
  return (
    <DevStudioProvider>
      <StudioBody />
    </DevStudioProvider>
  );
}
