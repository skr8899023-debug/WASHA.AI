import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  FailureMode,
  GeneratedDesign,
  GenerationErrorInfo,
  GenerationStatus,
  HistoryItem,
} from "../lib/types";
import { garmentById, colorById, positionById, styleById, paletteById } from "../lib/catalog";
import { improvePrompt } from "../lib/prompt";
import { GenerationError, PROVIDERS, errorInfo, generateDesign } from "../lib/generation";
import { loadHistory, newId, saveHistory } from "../lib/history";

export const STEP_LABELS = [
  "اختيار القطعة",
  "وصف الفكرة",
  "موضع الطباعة",
  "الأسلوب الفني",
  "لوحة الألوان",
  "التوليد والمراجعة",
] as const;

export interface DevState {
  step: number;
  garmentId: string | null;
  colorId: string | null;
  size: string | null;
  rawIdea: string;
  improvedPrompt: string;
  promptApproved: boolean;
  positionId: string | null;
  styleId: string | null;
  paletteId: string | null;
  status: GenerationStatus;
  error: GenerationErrorInfo | null;
  current: GeneratedDesign | null;
  variant: number;
  providerIndex: number;
  failureMode: FailureMode;
  history: HistoryItem[];
  historyOpen: boolean;
  compareOpen: boolean;
  lastDuration: number | null;
  lastError: string | null;
}

const initialState: DevState = {
  step: 0,
  garmentId: null,
  colorId: null,
  size: null,
  rawIdea: "",
  improvedPrompt: "",
  promptApproved: false,
  positionId: null,
  styleId: null,
  paletteId: null,
  status: "idle",
  error: null,
  current: null,
  variant: 0,
  providerIndex: 0,
  failureMode: "none",
  history: [],
  historyOpen: false,
  compareOpen: false,
  lastDuration: null,
  lastError: null,
};

type Action =
  | { type: "patch"; patch: Partial<DevState> }
  | { type: "generation-start" }
  | { type: "generation-success"; design: GeneratedDesign }
  | { type: "generation-failure"; error: GenerationErrorInfo };

function reducer(state: DevState, action: Action): DevState {
  switch (action.type) {
    case "patch":
      return { ...state, ...action.patch };
    case "generation-start":
      return { ...state, status: "loading", error: null };
    case "generation-success":
      return {
        ...state,
        status: "success",
        current: action.design,
        lastDuration: action.design.duration,
        error: null,
      };
    case "generation-failure":
      return {
        ...state,
        status: "error",
        error: action.error,
        lastError: action.error.message,
        // busy providers flip to the fallback for the next attempt
        providerIndex:
          action.error.code === "busy" ? (state.providerIndex + 1) % PROVIDERS.length : state.providerIndex,
      };
    default:
      return state;
  }
}

export interface DevStudioApi {
  state: DevState;
  patch: (patch: Partial<DevState>) => void;
  goToStep: (step: number) => void;
  stepReady: (step: number) => boolean;
  buildImprovedPrompt: () => string | null;
  generate: () => Promise<void>;
  saveCurrent: () => void;
  restoreItem: (item: HistoryItem) => void;
  deleteItem: (id: string) => void;
  toggleStar: (id: string) => void;
  bestItem: HistoryItem | null;
  previousItem: HistoryItem | null;
}

const Ctx = createContext<DevStudioApi | null>(null);

export function useDevStudio(): DevStudioApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDevStudio must be used inside DevStudioProvider");
  return ctx;
}

export function DevStudioProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (s) => ({
    ...s,
    history: loadHistory(),
  }));

  useEffect(() => {
    saveHistory(state.history);
  }, [state.history]);

  const patch = useCallback((p: Partial<DevState>) => dispatch({ type: "patch", patch: p }), []);

  /** completion gate per step index */
  const stepReady = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0:
          return Boolean(state.garmentId && state.colorId);
        case 1:
          return state.rawIdea.trim().length >= 6;
        case 2:
          return Boolean(state.positionId);
        case 3:
          return Boolean(state.styleId);
        case 4:
          return Boolean(state.paletteId);
        default:
          return true;
      }
    },
    [state.garmentId, state.colorId, state.rawIdea, state.positionId, state.styleId, state.paletteId],
  );

  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step > 5) return;
      // only allow jumping forward past completed gates
      for (let i = 0; i < step; i++) {
        if (!stepReady(i)) return;
      }
      patch({ step });
    },
    [patch, stepReady],
  );

  const buildImprovedPrompt = useCallback((): string | null => {
    const garment = garmentById(state.garmentId);
    const color = colorById(garment, state.colorId);
    const position = positionById(state.positionId);
    const style = styleById(state.styleId);
    const palette = paletteById(state.paletteId);
    if (!garment || !color || !position || !style || !palette || !state.rawIdea.trim()) return null;
    return improvePrompt({
      raw: state.rawIdea,
      garment,
      color,
      size: state.size,
      position,
      style,
      palette,
    });
  }, [state.garmentId, state.colorId, state.size, state.rawIdea, state.positionId, state.styleId, state.paletteId]);

  const generate = useCallback(async () => {
    const prompt = state.improvedPrompt.trim() || state.rawIdea.trim();
    if (!prompt || state.status === "loading") return;
    dispatch({ type: "generation-start" });
    const nextVariant = state.variant + 1;
    patch({ variant: nextVariant });
    try {
      const result = await generateDesign({
        prompt,
        variant: nextVariant,
        failureMode: state.failureMode,
        providerIndex: state.providerIndex,
      });
      dispatch({
        type: "generation-success",
        design: { ...result, createdAt: Date.now() },
      });
    } catch (err) {
      const info = err instanceof GenerationError ? err.info : errorInfo("unknown");
      console.error("[washa-dev] generation failed", err);
      dispatch({ type: "generation-failure", error: info });
    }
  }, [state.improvedPrompt, state.rawIdea, state.status, state.variant, state.failureMode, state.providerIndex, patch]);

  const saveCurrent = useCallback(() => {
    if (!state.current || !state.garmentId || !state.colorId || !state.positionId || !state.styleId || !state.paletteId)
      return;
    const item: HistoryItem = {
      id: newId(),
      createdAt: state.current.createdAt,
      prompt: state.rawIdea,
      improvedPrompt: state.improvedPrompt,
      garment: state.garmentId,
      color: state.colorId,
      size: state.size,
      position: state.positionId,
      style: state.styleId,
      palette: state.paletteId,
      provider: state.current.provider,
      duration: state.current.duration,
      seed: state.current.seed,
      starred: false,
    };
    patch({ history: [item, ...state.history] });
  }, [state, patch]);

  const restoreItem = useCallback(
    (item: HistoryItem) => {
      patch({
        garmentId: item.garment,
        colorId: item.color,
        size: item.size,
        rawIdea: item.prompt,
        improvedPrompt: item.improvedPrompt,
        promptApproved: true,
        positionId: item.position,
        styleId: item.style,
        paletteId: item.palette,
        status: "success",
        error: null,
        current: {
          seed: item.seed,
          provider: item.provider,
          duration: item.duration,
          createdAt: item.createdAt,
        },
        step: 5,
        historyOpen: false,
      });
    },
    [patch],
  );

  const deleteItem = useCallback(
    (id: string) => {
      patch({ history: state.history.filter((h) => h.id !== id) });
    },
    [state.history, patch],
  );

  const toggleStar = useCallback(
    (id: string) => {
      // only one "best" design at a time
      patch({
        history: state.history.map((h) =>
          h.id === id ? { ...h, starred: !h.starred } : { ...h, starred: false },
        ),
      });
    },
    [state.history, patch],
  );

  const bestItem = useMemo(() => state.history.find((h) => h.starred) ?? null, [state.history]);
  const previousItem = useMemo(() => state.history[0] ?? null, [state.history]);

  const api = useMemo<DevStudioApi>(
    () => ({
      state,
      patch,
      goToStep,
      stepReady,
      buildImprovedPrompt,
      generate,
      saveCurrent,
      restoreItem,
      deleteItem,
      toggleStar,
      bestItem,
      previousItem,
    }),
    [state, patch, goToStep, stepReady, buildImprovedPrompt, generate, saveCurrent, restoreItem, deleteItem, toggleStar, bestItem, previousItem],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
