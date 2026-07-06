import { create } from "zustand";
import type { Mode } from "../types";

interface ChemistryState {
  mode: Mode;
  selectedId: string | null;
  hoveredId: string | null;
  labelsVisible: boolean;
  /** bump to trigger a camera reset */
  resetSignal: number;
  activeJourneyId: string | null;
  activeExperimentId: string | null;
  setMode: (mode: Mode) => void;
  selectItem: (id: string | null) => void;
  setHovered: (id: string | null) => void;
  toggleLabels: () => void;
  resetView: () => void;
  openJourney: (id: string | null) => void;
  openExperiment: (id: string | null) => void;
  /** deep-link: jump to explore mode focused on an item */
  focusInLab: (id: string) => void;
  /** deep-link: open a specific experiment */
  goToExperiment: (id: string) => void;
}

export const useChemistryStore = create<ChemistryState>((set) => ({
  mode: "explore",
  selectedId: null,
  hoveredId: null,
  labelsVisible: true,
  resetSignal: 0,
  activeJourneyId: null,
  activeExperimentId: null,
  setMode: (mode) => set({ mode }),
  selectItem: (id) => set({ selectedId: id }),
  setHovered: (id) => set({ hoveredId: id }),
  toggleLabels: () => set((s) => ({ labelsVisible: !s.labelsVisible })),
  resetView: () => set((s) => ({ resetSignal: s.resetSignal + 1, selectedId: null })),
  openJourney: (id) => set({ activeJourneyId: id }),
  openExperiment: (id) => set({ activeExperimentId: id }),
  focusInLab: (id) => set({ mode: "explore", selectedId: id }),
  goToExperiment: (id) => set({ mode: "experiments", activeExperimentId: id }),
}));
