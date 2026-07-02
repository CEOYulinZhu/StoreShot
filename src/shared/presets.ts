import type { SizePreset, StoreShotPresetId, TargetSize } from "./types";

export const MIN_SIZE = 64;
export const MAX_SIZE = 8000;

// 预设只覆盖当前扩展商店素材制作中最常用的尺寸；其他平台或变更中的尺寸走自定义输入。
export const SIZE_PRESETS: SizePreset[] = [
  {
    id: "store-screenshot-1280x800",
    width: 1280,
    height: 800,
    titleKey: "presetScreenshotTitle",
    detailKey: "presetScreenshotDetail"
  },
  {
    id: "store-promo-440x280",
    width: 440,
    height: 280,
    titleKey: "presetPromoTitle",
    detailKey: "presetPromoDetail"
  },
  {
    id: "store-banner-1400x560",
    width: 1400,
    height: 560,
    titleKey: "presetBannerTitle",
    detailKey: "presetBannerDetail"
  }
];

export const DEFAULT_SETTINGS = {
  presetId: "store-screenshot-1280x800" as StoreShotPresetId,
  customSize: { width: 1280, height: 800 },
  lastSize: { width: 1280, height: 800 }
};

export function findPreset(id: StoreShotPresetId): SizePreset | undefined {
  return SIZE_PRESETS.find((preset) => preset.id === id);
}

export function getSizeForPreset(id: StoreShotPresetId, customSize: TargetSize): TargetSize {
  if (id === "custom") {
    return customSize;
  }

  const preset = findPreset(id);
  return preset ? { width: preset.width, height: preset.height } : DEFAULT_SETTINGS.lastSize;
}

export function normalizeSize(size: TargetSize): TargetSize {
  return {
    width: Math.round(size.width),
    height: Math.round(size.height)
  };
}

export function validateSize(size: TargetSize): string | null {
  const normalized = normalizeSize(size);
  if (!Number.isFinite(normalized.width) || !Number.isFinite(normalized.height)) {
    return "errorInvalidSize";
  }

  if (normalized.width < MIN_SIZE || normalized.height < MIN_SIZE) {
    return "errorSizeTooSmall";
  }

  if (normalized.width > MAX_SIZE || normalized.height > MAX_SIZE) {
    return "errorSizeTooLarge";
  }

  return null;
}
