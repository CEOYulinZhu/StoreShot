import { cropScreenshotToTarget } from "../shared/image";
import { getPresetIdForCommand } from "../shared/commands";
import { captureError, isStoreShotMessage } from "../shared/messages";
import { startSelectionForPreset } from "../shared/selection";
import { createSelectionPositionKey, normalizeSelectionRect } from "../shared/selection-position";
import {
  loadSelectionPositionSettings,
  loadSettings,
  loadShortcutSettings,
  saveSelectionPosition
} from "../shared/storage";
import type { CaptureResult, CaptureSelectionPayload } from "../shared/types";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isStoreShotMessage(message) || message.type !== "STORESHOT_CAPTURE_SELECTION") {
    return false;
  }

  // 背景页只负责把“选区信息”转成最终 PNG，不参与页面交互。
  // 这让截图、裁剪和下载从页面上下文中隔离出来，减少页面脚本被污染的风险。
  void handleCapture(message.payload, sender)
    .then(sendResponse)
    .catch((error) => sendResponse(captureError(error)));

  return true;
});

chrome.commands.onCommand.addListener((commandName) => {
  void handlePresetCommand(commandName);
});

async function handlePresetCommand(commandName: string): Promise<void> {
  const presetId = getPresetIdForCommand(commandName);
  if (!presetId) {
    return;
  }

  try {
    const shortcutSettings = await loadShortcutSettings();
    if (!shortcutSettings.shortcutsEnabled) {
      return;
    }

    const settings = await loadSettings();
    await startSelectionForPreset(presetId, settings.customSize, { active: true, lastFocusedWindow: true });
  } catch (error) {
    console.warn("[StoreShot] Shortcut capture could not start.", error);
  }
}

async function handleCapture(
  payload: CaptureSelectionPayload,
  sender: chrome.runtime.MessageSender
): Promise<CaptureResult> {
  const tab = sender.tab;
  if (!tab?.windowId) {
    throw new Error("errorNoActiveTab");
  }

  try {
    // tabs.captureVisibleTab 只能拿到当前可见视口，所以裁剪和缩放必须在这里完成。
    const screenshotDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    const cropped = await cropScreenshotToTarget(screenshotDataUrl, payload);
    const filename = makeFilename(cropped.width, cropped.height);

    await chrome.downloads.download({
      url: cropped.dataUrl,
      filename,
      saveAs: true,
      conflictAction: "uniquify"
    });

    await rememberSuccessfulSelection(payload, tab.url);

    return {
      ok: true,
      filename
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("error")) {
      throw error;
    }

    throw new Error("errorCaptureFailed");
  }
}

async function rememberSuccessfulSelection(payload: CaptureSelectionPayload, tabUrl: string | undefined): Promise<void> {
  try {
    const settings = await loadSelectionPositionSettings();
    if (!settings.rememberSelectionPosition) {
      return;
    }

    const key = createSelectionPositionKey(tabUrl, payload.targetSize);
    const normalizedRect = normalizeSelectionRect(payload.rect, payload.viewport);
    if (key && normalizedRect) {
      await saveSelectionPosition(key, normalizedRect);
    }
  } catch (error) {
    // 下载已经成功；位置记忆是非关键能力，存储失败不能改变截图结果。
    console.warn("[StoreShot] Selection position could not be saved.", error);
  }
}

function makeFilename(width: number, height: number): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `StoreShot/storeshot-${width}x${height}-${stamp}.png`;
}
