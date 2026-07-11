import type { NormalizedSelectionRect, SelectionRect, TargetSize, ViewportSnapshot } from "./types";

const RATIO_TOLERANCE = 0.01;

export function createSelectionPositionKey(urlValue: string | undefined, targetSize: TargetSize): string | null {
  if (
    !Number.isFinite(targetSize.width) ||
    !Number.isFinite(targetSize.height) ||
    targetSize.width <= 0 ||
    targetSize.height <= 0
  ) {
    return null;
  }

  try {
    const url = new URL(urlValue ?? "");
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return `${url.origin}|${Math.round(targetSize.width)}x${Math.round(targetSize.height)}`;
  } catch {
    return null;
  }
}

export function normalizeSelectionRect(
  rect: SelectionRect,
  viewport: ViewportSnapshot
): NormalizedSelectionRect | null {
  if (!isFiniteRect(rect) || !isPositiveViewport(viewport)) {
    return null;
  }

  const normalized = {
    x: rect.x / viewport.width,
    y: rect.y / viewport.height,
    width: rect.width / viewport.width,
    height: rect.height / viewport.height,
    viewportAspectRatio: viewport.width / viewport.height
  };

  return isNormalizedSelectionRect(normalized) ? normalized : null;
}

export function restoreSelectionRect(
  value: unknown,
  viewportWidth: number,
  viewportHeight: number,
  targetSize: TargetSize,
  minSelection: number
): SelectionRect | null {
  if (
    !isNormalizedSelectionRect(value) ||
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(viewportHeight) ||
    viewportWidth < minSelection ||
    viewportHeight < minSelection
  ) {
    return null;
  }

  const targetRatio = targetSize.width / targetSize.height;
  const savedRatio = (value.width / value.height) * value.viewportAspectRatio;
  if (!Number.isFinite(targetRatio) || targetRatio <= 0 || Math.abs(savedRatio / targetRatio - 1) > RATIO_TOLERANCE) {
    return null;
  }

  let width = value.width * viewportWidth;
  let height = width / targetRatio;
  const scale = Math.min(1, viewportWidth / width, viewportHeight / height);
  width *= scale;
  height *= scale;
  if (width < minSelection || height < minSelection) {
    return null;
  }

  return {
    x: clamp(value.x * viewportWidth, 0, viewportWidth - width),
    y: clamp(value.y * viewportHeight, 0, viewportHeight - height),
    width,
    height
  };
}

export function isNormalizedSelectionRect(value: unknown): value is NormalizedSelectionRect {
  if (!isFiniteRect(value)) {
    return false;
  }

  const normalized = value as Partial<NormalizedSelectionRect>;

  return (
    value.x >= 0 &&
    value.y >= 0 &&
    value.width > 0 &&
    value.height > 0 &&
    typeof normalized.viewportAspectRatio === "number" &&
    Number.isFinite(normalized.viewportAspectRatio) &&
    normalized.viewportAspectRatio > 0 &&
    value.x + value.width <= 1 &&
    value.y + value.height <= 1
  );
}

function isFiniteRect(value: unknown): value is SelectionRect {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const rect = value as Partial<SelectionRect>;
  return [rect.x, rect.y, rect.width, rect.height].every(
    (part) => typeof part === "number" && Number.isFinite(part)
  );
}

function isPositiveViewport(viewport: ViewportSnapshot): boolean {
  return Number.isFinite(viewport.width) && Number.isFinite(viewport.height) && viewport.width > 0 && viewport.height > 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
