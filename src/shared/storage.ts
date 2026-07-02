import { getChrome } from "./chrome";
import { DEFAULT_SETTINGS, SIZE_PRESETS, getSizeForPreset, validateSize } from "./presets";
import type { ShortcutSettings, StoreShotSettings, StoreShotPresetId, TargetSize } from "./types";

const SETTINGS_KEY = "storeshot.settings";
const SHORTCUT_SETTINGS_KEY = "storeshot.shortcuts";
const DEFAULT_SHORTCUT_SETTINGS: ShortcutSettings = {
  shortcutsEnabled: true
};

export async function loadSettings(): Promise<StoreShotSettings> {
  const api = getChrome();
  const data = await api.storage.sync.get(SETTINGS_KEY);
  const raw = data[SETTINGS_KEY] as Partial<StoreShotSettings> | undefined;
  // 存储里只保存用户最近一次使用的选项；读取时要容忍旧数据或被手工清空后的缺省值。
  const presetId = isPresetId(raw?.presetId) ? raw.presetId : DEFAULT_SETTINGS.presetId;
  const customSize = raw?.customSize ?? DEFAULT_SETTINGS.customSize;
  const lastSize = raw?.lastSize ?? getSizeForPreset(presetId, customSize);

  return {
    presetId,
    customSize,
    lastSize
  };
}

function isPresetId(value: unknown): value is StoreShotPresetId {
  return value === "custom" || SIZE_PRESETS.some((preset) => preset.id === value);
}

export async function saveSettings(settings: StoreShotSettings): Promise<void> {
  await getChrome().storage.sync.set({ [SETTINGS_KEY]: settings });
}

export async function updateSelectedSize(
  presetId: StoreShotPresetId,
  customSize: TargetSize
): Promise<StoreShotSettings> {
  const targetSize = getSizeForPreset(presetId, customSize);
  const errorKey = validateSize(targetSize);
  if (errorKey) {
    throw new Error(errorKey);
  }

  // 这里把“当前选择”和“最终导出尺寸”一起落盘，方便 popup、content 与后续会话保持一致。
  const settings: StoreShotSettings = {
    presetId,
    customSize,
    lastSize: targetSize
  };

  await saveSettings(settings);
  return settings;
}

export async function loadShortcutSettings(): Promise<ShortcutSettings> {
  const data = await getChrome().storage.sync.get(SHORTCUT_SETTINGS_KEY);
  const raw = data[SHORTCUT_SETTINGS_KEY] as Partial<ShortcutSettings> | undefined;

  return {
    shortcutsEnabled:
      typeof raw?.shortcutsEnabled === "boolean"
        ? raw.shortcutsEnabled
        : DEFAULT_SHORTCUT_SETTINGS.shortcutsEnabled
  };
}

export async function saveShortcutSettings(settings: ShortcutSettings): Promise<void> {
  await getChrome().storage.sync.set({ [SHORTCUT_SETTINGS_KEY]: settings });
}
