import { getChrome } from "./chrome";
import { isNormalizedSelectionRect } from "./selection-position";
import type { CaptureResult, StoreShotMessage } from "./types";

export async function sendTabMessage<TResponse>(
  tabId: number,
  message: StoreShotMessage
): Promise<TResponse> {
  return getChrome().tabs.sendMessage(tabId, message);
}

export function isStoreShotMessage(message: unknown): message is StoreShotMessage {
  if (typeof message !== "object" || message === null || !("type" in message) || !("payload" in message)) {
    return false;
  }

  const candidate = message as { type: unknown; payload: unknown };
  if (typeof candidate.payload !== "object" || candidate.payload === null) {
    return false;
  }

  const payload = candidate.payload as Record<string, unknown>;
  if (candidate.type === "STORESHOT_START_SELECTION") {
    return (
      isTargetSize(payload.targetSize) &&
      typeof payload.presetId === "string" &&
      (payload.savedRect === undefined || isNormalizedSelectionRect(payload.savedRect))
    );
  }

  if (candidate.type === "STORESHOT_CAPTURE_SELECTION") {
    return isRect(payload.rect) && isViewport(payload.viewport) && isTargetSize(payload.targetSize);
  }

  return false;
}

function isTargetSize(value: unknown): boolean {
  return isFiniteRecord(value, ["width", "height"]) && value.width > 0 && value.height > 0;
}

function isRect(value: unknown): boolean {
  return (
    isFiniteRecord(value, ["x", "y", "width", "height"]) &&
    value.width > 0 &&
    value.height > 0
  );
}

function isViewport(value: unknown): boolean {
  return (
    isFiniteRecord(value, ["width", "height", "devicePixelRatio"]) &&
    value.width > 0 &&
    value.height > 0 &&
    value.devicePixelRatio > 0
  );
}

function isFiniteRecord<T extends string>(value: unknown, keys: T[]): value is Record<T, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    keys.every((key) => typeof (value as Record<string, unknown>)[key] === "number" &&
      Number.isFinite((value as Record<string, number>)[key]))
  );
}

export function captureError(error: unknown): CaptureResult {
  // 后台页通过 sendResponse 返回结构化错误，content script 才能用本地化文案继续提示用户。
  return {
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  };
}
