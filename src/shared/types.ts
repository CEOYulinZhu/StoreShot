export type StoreShotPresetId =
  | "store-screenshot-1280x800"
  | "store-promo-440x280"
  | "store-banner-1400x560"
  | "custom";

export interface TargetSize {
  width: number;
  height: number;
}

export interface SizePreset extends TargetSize {
  id: StoreShotPresetId;
  titleKey: string;
  detailKey: string;
}

export interface StoreShotSettings {
  presetId: StoreShotPresetId;
  customSize: TargetSize;
  lastSize: TargetSize;
}

export interface ShortcutSettings {
  shortcutsEnabled: boolean;
}

export interface SelectionPositionSettings {
  rememberSelectionPosition: boolean;
}

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NormalizedSelectionRect extends SelectionRect {
  viewportAspectRatio: number;
}

export interface ViewportSnapshot {
  width: number;
  height: number;
  devicePixelRatio: number;
}

export interface StartSelectionPayload {
  targetSize: TargetSize;
  presetId: StoreShotPresetId;
  savedRect?: NormalizedSelectionRect;
}

export interface CaptureSelectionPayload {
  rect: SelectionRect;
  viewport: ViewportSnapshot;
  targetSize: TargetSize;
}

export interface CaptureResult {
  ok: boolean;
  filename?: string;
  error?: string;
}

export type StoreShotMessage =
  | {
      type: "STORESHOT_START_SELECTION";
      payload: StartSelectionPayload;
    }
  | {
      type: "STORESHOT_CAPTURE_SELECTION";
      payload: CaptureSelectionPayload;
    };
