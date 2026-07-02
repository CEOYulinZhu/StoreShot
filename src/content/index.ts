import styles from "./overlay.css?inline";
import type { CaptureResult, SelectionRect, StartSelectionPayload } from "../shared/types";

const HOST_ID = "storeshot-overlay-host";
const MIN_SELECTION = 80;

let controller: SelectionController | null = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isStoreShotMessage(message) || message.type !== "STORESHOT_START_SELECTION") {
    return false;
  }

  // 每次开始新一轮选择时，都销毁旧控制器，避免残留遮罩、事件监听器和旧状态。
  controller?.destroy();
  controller = new SelectionController(message.payload);
  sendResponse({ ok: true });
  return false;
});

function t(key: string, substitutions?: string | string[]): string {
  const message = chrome.i18n.getMessage(key, substitutions);
  return message || key;
}

function isStoreShotMessage(message: unknown): message is {
  type: "STORESHOT_START_SELECTION" | "STORESHOT_CAPTURE_SELECTION";
  payload: StartSelectionPayload;
} {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    typeof (message as { type: unknown }).type === "string" &&
    (message as { type: string }).type.startsWith("STORESHOT_")
  );
}

class SelectionController {
  private readonly host: HTMLDivElement;
  private readonly root: ShadowRoot;
  private readonly selection: HTMLDivElement;
  private readonly toolbar: HTMLDivElement;
  private readonly sizeLabel: HTMLSpanElement;
  private readonly targetRatio: number;
  private rect: SelectionRect;
  private dragState: DragState | null = null;

  constructor(private readonly payload: StartSelectionPayload) {
    this.targetRatio = payload.targetSize.width / payload.targetSize.height;
    this.rect = this.createInitialRect();
    this.host = document.createElement("div");
    this.host.id = HOST_ID;
    // 选择层挂在 Shadow DOM 中，尽量避免被宿主页面的全局样式影响，也不把扩展样式泄漏回页面。
    this.root = this.host.attachShadow({ mode: "open" });
    this.selection = document.createElement("div");
    this.toolbar = document.createElement("div");
    this.sizeLabel = document.createElement("span");

    this.mount();
    this.updateLayout();
  }

  destroy(): void {
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("resize", this.handleResize);
    this.host.remove();
    if (controller === this) {
      controller = null;
    }
  }

  private mount(): void {
    document.getElementById(HOST_ID)?.remove();

    const style = document.createElement("style");
    style.textContent = styles;

    const rootElement = document.createElement("div");
    rootElement.className = "root";

    this.selection.className = "selection";
    this.selection.addEventListener("pointerdown", this.handleSelectionPointerDown);

    for (const handle of ["nw", "ne", "sw", "se"]) {
      const handleElement = document.createElement("div");
      handleElement.className = "handle";
      handleElement.dataset.handle = handle;
      handleElement.addEventListener("pointerdown", this.handleHandlePointerDown);
      this.selection.append(handleElement);
    }

    this.toolbar.className = "toolbar";
    this.sizeLabel.className = "size";

    const exportButton = document.createElement("button");
    exportButton.className = "button primary";
    exportButton.type = "button";
    exportButton.textContent = t("confirmCapture");
    exportButton.addEventListener("click", () => {
      void this.capture();
    });

    const cancelButton = document.createElement("button");
    cancelButton.className = "button";
    cancelButton.type = "button";
    cancelButton.textContent = t("cancelCapture");
    cancelButton.addEventListener("click", () => this.destroy());

    this.toolbar.append(this.sizeLabel, exportButton, cancelButton);
    rootElement.append(this.selection, this.toolbar);
    this.root.append(style, rootElement);
    document.documentElement.append(this.host);
    window.addEventListener("resize", this.handleResize);
  }

  private createInitialRect(): SelectionRect {
    // 初始选区按目标比例尽量铺开当前视口，让用户一开始就看到接近最终成图比例的取景框。
    const margin = 32;
    const maxWidth = Math.max(MIN_SELECTION, window.innerWidth - margin * 2);
    const maxHeight = Math.max(MIN_SELECTION, window.innerHeight - margin * 2);
    let width = Math.min(maxWidth, Math.round(window.innerWidth * 0.72));
    let height = Math.round(width / this.targetRatio);

    if (height > maxHeight) {
      height = Math.min(maxHeight, Math.round(window.innerHeight * 0.72));
      width = Math.round(height * this.targetRatio);
    }

    width = Math.max(MIN_SELECTION, Math.min(width, maxWidth));
    height = Math.max(MIN_SELECTION, Math.min(height, maxHeight));

    return {
      x: Math.round((window.innerWidth - width) / 2),
      y: Math.round((window.innerHeight - height) / 2),
      width,
      height
    };
  }

  private updateLayout(): void {
    this.rect = clampRectToViewport(this.rect);
    Object.assign(this.selection.style, {
      left: `${this.rect.x}px`,
      top: `${this.rect.y}px`,
      width: `${this.rect.width}px`,
      height: `${this.rect.height}px`
    });

    this.sizeLabel.textContent = t("selectionToolbarSize", [
      String(Math.round(this.rect.width)),
      String(Math.round(this.rect.height)),
      String(this.payload.targetSize.width),
      String(this.payload.targetSize.height)
    ]);

    this.toolbar.style.width = "max-content";
    const toolbarWidth = Math.min(this.toolbar.offsetWidth, window.innerWidth - 24);
    const toolbarLeft = clamp(this.rect.x + this.rect.width / 2 - toolbarWidth / 2, 12, window.innerWidth - toolbarWidth - 12);
    const belowTop = this.rect.y + this.rect.height + 12;
    const toolbarTop = belowTop + 58 < window.innerHeight ? belowTop : Math.max(12, this.rect.y - 58);

    Object.assign(this.toolbar.style, {
      left: `${toolbarLeft}px`,
      top: `${toolbarTop}px`
    });
  }

  private readonly handleSelectionPointerDown = (event: PointerEvent): void => {
    if ((event.target as HTMLElement).classList.contains("handle")) {
      return;
    }

    event.preventDefault();
    this.selection.setPointerCapture(event.pointerId);
    this.dragState = {
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      startRect: { ...this.rect }
    };
    this.bindDragEvents();
  };

  private readonly handleHandlePointerDown = (event: PointerEvent): void => {
    const handle = (event.currentTarget as HTMLElement).dataset.handle as ResizeHandle | undefined;
    if (!handle) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragState = {
      mode: "resize",
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startRect: { ...this.rect }
    };
    this.bindDragEvents();
  };

  private bindDragEvents(): void {
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp, { once: true });
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragState) {
      return;
    }

    const dx = event.clientX - this.dragState.startX;
    const dy = event.clientY - this.dragState.startY;

    if (this.dragState.mode === "move") {
      this.rect = {
        ...this.dragState.startRect,
        x: this.dragState.startRect.x + dx,
        y: this.dragState.startRect.y + dy
      };
    } else {
      this.rect = resizeWithAspect(this.dragState.startRect, this.dragState.handle, dx, dy, this.targetRatio);
    }

    this.updateLayout();
  };

  private readonly handlePointerUp = (): void => {
    window.removeEventListener("pointermove", this.handlePointerMove);
    this.dragState = null;
  };

  private readonly handleResize = (): void => {
    this.rect = clampRectToViewport(this.rect);
    this.updateLayout();
  };

  private async capture(): Promise<void> {
    if (this.rect.width < MIN_SELECTION || this.rect.height < MIN_SELECTION) {
      this.showToast(t("errorSelectionTooSmall"), "error");
      return;
    }

    // 先隐藏覆盖层再截图，确保浏览器只看到原始页面内容，不把选框和工具条一起截进去。
    this.showToast(t("captureWorking"));
    this.host.style.display = "none";
    await nextAnimationFrame();

    try {
      const result = await chrome.runtime.sendMessage<CaptureResult>({
        type: "STORESHOT_CAPTURE_SELECTION",
        payload: {
          // 这里发送的是视口坐标和设备像素比，背景页会据此换算到真实位图坐标。
          rect: {
            x: Math.round(this.rect.x),
            y: Math.round(this.rect.y),
            width: Math.round(this.rect.width),
            height: Math.round(this.rect.height)
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1
          },
          targetSize: this.payload.targetSize
        }
      });

      if (result.ok) {
        this.host.style.display = "";
        this.showToast(t("captureComplete", result.filename ?? "PNG"));
        window.setTimeout(() => this.destroy(), 650);
        return;
      }

      this.host.style.display = "";
      this.showToast(t(result.error ?? "errorCaptureFailed"), "error");
    } catch {
      this.host.style.display = "";
      this.showToast(t("errorCaptureFailed"), "error");
    }
  }

  private showToast(message: string, tone: "neutral" | "error" = "neutral"): void {
    this.root.querySelector(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = `toast ${tone === "error" ? "error" : ""}`;
    toast.textContent = message;
    this.root.querySelector(".root")?.append(toast);
    window.setTimeout(() => toast.remove(), 3600);
  }
}

type ResizeHandle = "nw" | "ne" | "sw" | "se";

type DragState =
  | {
      mode: "move";
      startX: number;
      startY: number;
      startRect: SelectionRect;
    }
  | {
      mode: "resize";
      handle: ResizeHandle;
      startX: number;
      startY: number;
      startRect: SelectionRect;
    };

function resizeWithAspect(rect: SelectionRect, handle: ResizeHandle, dx: number, dy: number, ratio: number): SelectionRect {
  // 四角缩放时保持目标比例不变，优先使用横向或纵向中变化更大的那个维度。
  const signX = handle.endsWith("e") ? 1 : -1;
  const signY = handle.startsWith("s") ? 1 : -1;
  const deltaFromX = rect.width + dx * signX;
  const deltaFromY = (rect.height + dy * signY) * ratio;
  const width = Math.max(MIN_SELECTION, Math.max(deltaFromX, deltaFromY));
  const height = Math.max(MIN_SELECTION, width / ratio);
  const x = handle.endsWith("e") ? rect.x : rect.x + rect.width - width;
  const y = handle.startsWith("s") ? rect.y : rect.y + rect.height - height;

  return clampRectToViewport({ x, y, width, height });
}

function clampRectToViewport(rect: SelectionRect): SelectionRect {
  // 选区始终要落在当前视口内，否则后续截图坐标会越界。
  const width = Math.min(Math.max(rect.width, MIN_SELECTION), window.innerWidth);
  const height = Math.min(Math.max(rect.height, MIN_SELECTION), window.innerHeight);
  const x = clamp(rect.x, 0, window.innerWidth - width);
  const y = clamp(rect.y, 0, window.innerHeight - height);

  return { x, y, width, height };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function nextAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
