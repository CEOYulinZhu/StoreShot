import { getChrome } from "./chrome";
import { SIZE_PRESETS } from "./presets";
import type { StoreShotPresetId } from "./types";

export type PresetShortcutMap = Partial<Record<StoreShotPresetId, string>>;

export const PRESET_COMMANDS: Record<Exclude<StoreShotPresetId, "custom">, string> = {
  "store-screenshot-1280x800": "capture-store-screenshot-1280x800",
  "store-promo-440x280": "capture-store-promo-440x280",
  "store-banner-1400x560": "capture-store-banner-1400x560"
};

export function getPresetCommandName(presetId: StoreShotPresetId): string | null {
  return presetId === "custom" ? null : PRESET_COMMANDS[presetId];
}

export function getPresetIdForCommand(commandName: string): StoreShotPresetId | null {
  return SIZE_PRESETS.find((preset) => getPresetCommandName(preset.id) === commandName)?.id ?? null;
}

export async function getPresetShortcuts(): Promise<PresetShortcutMap> {
  const commands = await getChrome().commands.getAll();
  return SIZE_PRESETS.reduce<PresetShortcutMap>((shortcuts, preset) => {
    const commandName = getPresetCommandName(preset.id);
    const shortcut = commands.find((command) => command.name === commandName)?.shortcut?.trim();
    if (shortcut) {
      shortcuts[preset.id] = shortcut;
    }

    return shortcuts;
  }, {});
}

export function getPresetIdForShortcut(
  event: KeyboardEvent,
  shortcuts: PresetShortcutMap
): StoreShotPresetId | null {
  const entry = Object.entries(shortcuts).find(([, shortcut]) => isShortcutEvent(event, shortcut));
  return (entry?.[0] as StoreShotPresetId | undefined) ?? null;
}

function isShortcutEvent(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split("+").map((part) => part.toLowerCase());
  const key = parts.at(-1);
  if (!key || normalizeKey(event.key) !== normalizeKey(key)) {
    return false;
  }

  return (
    event.altKey === parts.includes("alt") &&
    event.shiftKey === parts.includes("shift") &&
    event.ctrlKey === (parts.includes("ctrl") || parts.includes("control") || parts.includes("macctrl")) &&
    event.metaKey === (parts.includes("command") || parts.includes("cmd") || parts.includes("meta"))
  );
}

function normalizeKey(key: string): string {
  return key.toLowerCase() === "plus" ? "+" : key.toLowerCase();
}
