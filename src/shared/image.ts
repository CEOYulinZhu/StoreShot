import type { CaptureSelectionPayload } from "./types";

const MAX_DATA_URL_CHUNK = 0x8000;

export interface CroppedImageResult {
  dataUrl: string;
  width: number;
  height: number;
}

export async function cropScreenshotToTarget(
  screenshotDataUrl: string,
  payload: CaptureSelectionPayload
): Promise<CroppedImageResult> {
  // captureVisibleTab 返回的是视口位图，而选区是 CSS 像素坐标；
  // 这里先把两者换算到同一坐标系，再裁剪并缩放到目标导出尺寸。
  const sourceBlob = await (await fetch(screenshotDataUrl)).blob();
  const sourceBitmap = await createImageBitmap(sourceBlob);
  const sourceWidth = sourceBitmap.width;
  const sourceHeight = sourceBitmap.height;
  const scaleX = sourceWidth / payload.viewport.width;
  const scaleY = sourceHeight / payload.viewport.height;
  const sx = clamp(Math.round(payload.rect.x * scaleX), 0, sourceWidth - 1);
  const sy = clamp(Math.round(payload.rect.y * scaleY), 0, sourceHeight - 1);
  const sw = clamp(Math.round(payload.rect.width * scaleX), 1, sourceWidth - sx);
  const sh = clamp(Math.round(payload.rect.height * scaleY), 1, sourceHeight - sy);
  const canvas = new OffscreenCanvas(payload.targetSize.width, payload.targetSize.height);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("errorCanvasUnavailable");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    sourceBitmap,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    payload.targetSize.width,
    payload.targetSize.height
  );

  const blob = await canvas.convertToBlob({ type: "image/png" });
  const dataUrl = await blobToDataUrl(blob);

  return {
    dataUrl,
    width: payload.targetSize.width,
    height: payload.targetSize.height
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  // OffscreenCanvas 产物要交给 downloads API，最终需要的是可下载的 data URL。
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";

  for (let index = 0; index < bytes.length; index += MAX_DATA_URL_CHUNK) {
    const chunk = bytes.subarray(index, index + MAX_DATA_URL_CHUNK);
    binary += String.fromCharCode(...chunk);
  }

  return `data:${blob.type};base64,${btoa(binary)}`;
}
