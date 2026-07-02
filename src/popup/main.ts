import "./popup.css";
import { getChrome } from "../shared/chrome";
import { getPresetIdForShortcut, getPresetShortcuts, type PresetShortcutMap } from "../shared/commands";
import { t, loadLocalePreference, localizeDocumentTitle } from "../shared/i18n";
import { SIZE_PRESETS, getSizeForPreset, normalizeSize, validateSize } from "../shared/presets";
import { startSelectionForPreset } from "../shared/selection";
import { loadSettings, loadShortcutSettings, updateSelectedSize } from "../shared/storage";
import type { ShortcutSettings, StoreShotPresetId, StoreShotSettings, TargetSize } from "../shared/types";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Popup root was not found.");
}

const appRoot = app;
const ERROR_AUTO_DISMISS_MS = 5000;

let settings: StoreShotSettings;
let shortcutSettings: ShortcutSettings = { shortcutsEnabled: true };
let selectedPresetId: StoreShotPresetId = "store-screenshot-1280x800";
let customSize: TargetSize = { width: 1280, height: 800 };
let presetShortcuts: PresetShortcutMap = {};
let isLaunching = false;
let errorKey: string | null = null;
let errorDismissTimer: number | null = null;

void init();

async function init(): Promise<void> {
  await loadLocalePreference();
  localizeDocumentTitle("popupTitle");
  settings = await loadSettings();
  shortcutSettings = await loadShortcutSettings();
  selectedPresetId = settings.presetId;
  customSize = settings.customSize;
  presetShortcuts = shortcutSettings.shortcutsEnabled ? await loadPresetShortcuts() : {};
  document.addEventListener("keydown", handlePopupShortcut);
  render();
}

function render(): void {
  const targetSize = getSizeForPreset(selectedPresetId, customSize);
  const isCustom = selectedPresetId === "custom";

  appRoot.innerHTML = `
    <section class="popup" aria-label="${t("popupTitle")}">
      <header class="header">
        <div class="brand-lockup">
          <img class="brand-logo" src="icons/icon128.png" alt="" aria-hidden="true" />
          <div class="brand">
            <h1 class="title">${t("popupTitle")}</h1>
            <p class="subtitle">${t("popupSubtitle")}</p>
          </div>
        </div>
        <button class="options-link" type="button" title="${t("openOptions")}" aria-label="${t("openOptions")}">
          <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" stroke="currentColor" stroke-width="1.8"/>
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.04.04a2.05 2.05 0 0 1-2.9 2.9l-.04-.04A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .58 1.7 1.7 0 0 0-.4 1.1V21a2.05 2.05 0 0 1-4.1 0v-.06A1.7 1.7 0 0 0 8.4 19.4a1.7 1.7 0 0 0-1.88.34l-.04.04a2.05 2.05 0 0 1-2.9-2.9l.04-.04A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.58-1H3a2.05 2.05 0 0 1 0-4.1h.06A1.7 1.7 0 0 0 4.6 8.4a1.7 1.7 0 0 0-.34-1.88l-.04-.04a2.05 2.05 0 0 1 2.9-2.9l.04.04A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.58V3a2.05 2.05 0 0 1 4.1 0v.06A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.04-.04a2.05 2.05 0 0 1 2.9 2.9l-.04.04A1.7 1.7 0 0 0 19.4 9c.22.62.8 1 1.58 1H21a2.05 2.05 0 0 1 0 4.1h-.06A1.7 1.7 0 0 0 19.4 15Z" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      </header>

      <div class="target-card">
        <div>
          <p class="target-label">${t("targetSize")}</p>
          <p class="target-value">${targetSize.width} x ${targetSize.height}</p>
        </div>
        <span class="target-unit">${t("pixels")}</span>
      </div>

      <section class="section">
        <h2 class="section-title">${t("presets")}</h2>
        <div class="preset-list">
          ${SIZE_PRESETS.map(
            (preset) => `
              <button class="preset ${presetShortcuts[preset.id] ? "has-shortcut" : ""} ${selectedPresetId === preset.id ? "is-active" : ""}" type="button" data-preset="${preset.id}">
                ${presetShortcuts[preset.id] ? `<span class="preset-shortcut">${presetShortcuts[preset.id]}</span>` : ""}
                <span class="preset-title">${t(preset.titleKey)}</span>
                <span class="preset-detail">${t(preset.detailKey)}</span>
              </button>
            `
          ).join("")}
          <button class="preset ${isCustom ? "is-active" : ""}" type="button" data-preset="custom">
            <span class="preset-title">${t("customPresetTitle")}</span>
            <span class="preset-detail">${customSize.width} x ${customSize.height}</span>
          </button>
        </div>
      </section>

      ${
        isCustom
          ? `
            <section class="section custom-section">
              <h2 class="section-title">${t("customSize")}</h2>
              <div class="custom-grid">
                <div class="field">
                  <label for="width">${t("width")}</label>
                  <input id="width" type="number" min="64" max="8000" step="1" value="${customSize.width}" />
                </div>
                <div class="field">
                  <label for="height">${t("height")}</label>
                  <input id="height" type="number" min="64" max="8000" step="1" value="${customSize.height}" />
                </div>
              </div>
            </section>
          `
          : ""
      }

      ${errorKey ? `<div class="error-message" role="alert">${t(errorKey)}</div>` : ""}
      <button class="primary-button" type="button" ${isLaunching ? "disabled" : ""}>${t("startCapture")}</button>
    </section>
  `;

  bindEvents();
}

function bindEvents(): void {
  appRoot.querySelector<HTMLButtonElement>(".options-link")?.addEventListener("click", () => {
    getChrome().runtime.openOptionsPage?.();
  });

  appRoot.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPresetId = button.dataset.preset as StoreShotPresetId;
      clearError();
      void persistAndRender();
    });
  });

  appRoot.querySelector<HTMLInputElement>("#width")?.addEventListener("change", handleCustomInput);
  appRoot.querySelector<HTMLInputElement>("#height")?.addEventListener("change", handleCustomInput);
  appRoot.querySelector<HTMLButtonElement>(".primary-button")?.addEventListener("click", () => {
    void launchSelection();
  });
}

async function handleCustomInput(): Promise<void> {
  const widthInput = appRoot.querySelector<HTMLInputElement>("#width");
  const heightInput = appRoot.querySelector<HTMLInputElement>("#height");
  const nextSize = normalizeSize({
    width: Number(widthInput?.value),
    height: Number(heightInput?.value)
  });

  customSize = nextSize;
  selectedPresetId = "custom";
  clearError();
  await persistAndRender();
}

async function persistAndRender(): Promise<void> {
  const nextErrorKey = validateSize(getSizeForPreset(selectedPresetId, customSize));
  if (nextErrorKey) {
    showError(nextErrorKey);
    return;
  }

  settings = await updateSelectedSize(selectedPresetId, customSize);
  clearError();
  render();
}

async function launchSelection(): Promise<void> {
  const targetSize = getSizeForPreset(selectedPresetId, customSize);
  const nextErrorKey = validateSize(targetSize);
  if (nextErrorKey) {
    showError(nextErrorKey);
    return;
  }

  isLaunching = true;
  clearError();
  render();

  try {
    settings = await startSelectionForPreset(selectedPresetId, customSize);
    window.close();
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "errorCaptureFailed";
    isLaunching = false;
    showError(isKnownErrorKey(message) ? message : "errorRestrictedPage");
  }
}

async function loadPresetShortcuts(): Promise<PresetShortcutMap> {
  try {
    return await getPresetShortcuts();
  } catch {
    return {};
  }
}

function handlePopupShortcut(event: KeyboardEvent): void {
  if (!shortcutSettings.shortcutsEnabled || isLaunching) {
    return;
  }

  const presetId = getPresetIdForShortcut(event, presetShortcuts);
  if (!presetId) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  selectedPresetId = presetId;
  clearError();
  void launchSelection();
}

function isKnownErrorKey(message: string): boolean {
  return message.startsWith("error");
}

function clearError(): void {
  if (errorDismissTimer !== null) {
    window.clearTimeout(errorDismissTimer);
    errorDismissTimer = null;
  }

  errorKey = null;
}

function showError(nextErrorKey: string): void {
  clearError();
  errorKey = nextErrorKey;
  render();

  errorDismissTimer = window.setTimeout(() => {
    if (errorKey === nextErrorKey) {
      errorKey = null;
      errorDismissTimer = null;
      render();
    }
  }, ERROR_AUTO_DISMISS_MS);
}
