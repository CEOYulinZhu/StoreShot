import { getChrome } from "./chrome";
import type { CaptureResult, StoreShotMessage } from "./types";

export async function sendTabMessage<TResponse>(
  tabId: number,
  message: StoreShotMessage
): Promise<TResponse> {
  return getChrome().tabs.sendMessage(tabId, message);
}

export function isStoreShotMessage(message: unknown): message is StoreShotMessage {
  // 内容脚本和后台页都可能收到其他扩展消息；只接受 StoreShot 自己的消息命名空间。
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    typeof (message as { type: unknown }).type === "string" &&
    (message as { type: string }).type.startsWith("STORESHOT_")
  );
}

export function captureError(error: unknown): CaptureResult {
  // 后台页通过 sendResponse 返回结构化错误，content script 才能用本地化文案继续提示用户。
  return {
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  };
}
