import { getChrome } from "./chrome";
import { sendTabMessage } from "./messages";
import { createSelectionPositionKey } from "./selection-position";
import { loadSelectionPosition, loadSelectionPositionSettings, updateSelectedSize } from "./storage";
import type { StoreShotMessage, StoreShotPresetId, StoreShotSettings, TargetSize } from "./types";

export async function startSelectionForPreset(
  presetId: StoreShotPresetId,
  customSize: TargetSize,
  tabQuery: chrome.tabs.QueryInfo = { active: true, currentWindow: true }
): Promise<StoreShotSettings> {
  const api = getChrome();
  const settings = await updateSelectedSize(presetId, customSize);
  const [tab] = await api.tabs.query(tabQuery);
  if (!tab?.id) {
    throw new Error("errorNoActiveTab");
  }

  let savedRect;
  try {
    const positionSettings = await loadSelectionPositionSettings();
    const positionKey = positionSettings.rememberSelectionPosition
      ? createSelectionPositionKey(tab.url, settings.lastSize)
      : null;
    savedRect = positionKey ? await loadSelectionPosition(positionKey) : null;
  } catch (error) {
    console.warn("[StoreShot] Saved selection position could not be loaded.", error);
  }

  const message: StoreShotMessage = {
    type: "STORESHOT_START_SELECTION",
    payload: {
      targetSize: settings.lastSize,
      presetId: settings.presetId,
      ...(savedRect ? { savedRect } : {})
    }
  };

  try {
    await sendTabMessage(tab.id, message);
  } catch {
    // 首次使用快捷键或 popup 时，目标页可能还没有 content script；按需注入后重发。
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    await sendTabMessage(tab.id, message);
  }

  return settings;
}
