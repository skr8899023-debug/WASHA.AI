import { create } from "zustand";
import type { AppMode, ScaleMode } from "../utils/astronomyTypes";

interface SpaceState {
  mode: AppMode;
  selectedBodyId: string | null;
  hoveredBodyId: string | null;
  showOrbits: boolean;
  scaleMode: ScaleMode;
  /** Increment to request a camera reset. */
  cameraResetToken: number;
  activeJourneyId: string | null;
  journeyStepIndex: number;
  compareOpen: boolean;
  compareA: string | null;
  compareB: string | null;
  reducedMotion: boolean;

  setMode: (mode: AppMode) => void;
  selectBody: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  toggleOrbits: () => void;
  setScaleMode: (mode: ScaleMode) => void;
  resetCamera: () => void;
  startJourney: (id: string) => void;
  setJourneyStep: (index: number) => void;
  exitJourney: () => void;
  setCompareOpen: (open: boolean) => void;
  setCompare: (slot: "a" | "b", id: string | null) => void;
}

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useSpaceStore = create<SpaceState>((set) => ({
  mode: "explore",
  selectedBodyId: null,
  hoveredBodyId: null,
  showOrbits: true,
  scaleMode: "teaching",
  cameraResetToken: 0,
  activeJourneyId: null,
  journeyStepIndex: 0,
  compareOpen: false,
  compareA: "earth",
  compareB: "mars",
  reducedMotion: prefersReducedMotion,

  setMode: (mode) =>
    set((s) => ({
      mode,
      // switching modes clears the current focus and any running journey
      selectedBodyId: null,
      cameraResetToken: s.cameraResetToken + 1,
      activeJourneyId: mode === "learn" ? s.activeJourneyId : null,
      journeyStepIndex: mode === "learn" ? s.journeyStepIndex : 0,
    })),
  selectBody: (id) => set({ selectedBodyId: id }),
  setHovered: (id) => set({ hoveredBodyId: id }),
  toggleOrbits: () => set((s) => ({ showOrbits: !s.showOrbits })),
  setScaleMode: (scaleMode) => set({ scaleMode }),
  resetCamera: () =>
    set((s) => ({ cameraResetToken: s.cameraResetToken + 1, selectedBodyId: null })),
  startJourney: (id) =>
    set({ activeJourneyId: id, journeyStepIndex: 0, mode: "learn" }),
  setJourneyStep: (index) => set({ journeyStepIndex: index }),
  exitJourney: () => set({ activeJourneyId: null, journeyStepIndex: 0 }),
  setCompareOpen: (compareOpen) => set({ compareOpen }),
  setCompare: (slot, id) =>
    set(slot === "a" ? { compareA: id } : { compareB: id }),
}));
