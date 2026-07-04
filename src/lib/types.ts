// Shared domain types for both studios. Internal code stays in English;
// every `label`/`hint` string value is Arabic customer-facing copy.

export interface GarmentColor {
  id: string;
  label: string;
  hex: string;
  /** whether print artwork should assume a light or dark base */
  ink: "light" | "dark";
}

export interface Garment {
  id: string;
  label: string;
  colors: GarmentColor[];
  sizes: string[];
}

export interface PrintPosition {
  id: string;
  label: string;
  hint: string;
}

export interface ArtStyle {
  id: string;
  label: string;
  hint: string;
  /** Arabic fragment merged into the improved prompt */
  promptFragment: string;
}

export interface Palette {
  id: string;
  label: string;
  colors: string[];
  promptFragment: string;
}

export type GenerationStatus = "idle" | "loading" | "success" | "error";

export type FailureMode = "none" | "random" | "quota" | "busy" | "payload";

export type GenerationErrorCode = "quota" | "busy" | "payload" | "unknown";

export interface GenerationErrorInfo {
  code: GenerationErrorCode;
  /** Arabic, shown to the user */
  message: string;
  /** Arabic, suggested next action */
  action: string;
}

export interface GeneratedDesign {
  seed: number;
  provider: string;
  /** ms */
  duration: number;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  createdAt: number;
  prompt: string;
  improvedPrompt: string;
  garment: string;
  color: string;
  size: string | null;
  position: string;
  style: string;
  palette: string;
  provider: string;
  duration: number;
  seed: number;
  starred: boolean;
}
