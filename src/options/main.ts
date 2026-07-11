import "./options.css";
import {
  getLocalePreference,
  loadLocalePreference,
  localizeDocumentTitle,
  saveLocalePreference,
  t
} from "../shared/i18n";
import { getPresetShortcuts, type PresetShortcutMap } from "../shared/commands";
import { SIZE_PRESETS } from "../shared/presets";
import {
  loadSelectionPositionSettings,
  loadShortcutSettings,
  saveSelectionPositionSettings,
  saveShortcutSettings
} from "../shared/storage";
import type { LocalePreference } from "../shared/locales";
import type { SelectionPositionSettings, ShortcutSettings } from "../shared/types";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Options root was not found.");
}

const appRoot = app;
let shortcutSettings: ShortcutSettings = { shortcutsEnabled: true };
let selectionPositionSettings: SelectionPositionSettings = { rememberSelectionPosition: true };
let presetShortcuts: PresetShortcutMap = {};

void init();

async function init(): Promise<void> {
  await loadLocalePreference();
  shortcutSettings = await loadShortcutSettings();
  selectionPositionSettings = await loadSelectionPositionSettings();
  presetShortcuts = await loadPresetShortcuts();
  render();
}

function render(): void {
  localizeDocumentTitle("optionsTitle");
  const preference = getLocalePreference();

  appRoot.innerHTML = `
    <main class="page">
      <div class="settings-list">
        <section class="panel setting-row" aria-labelledby="language-title">
          <div class="section-heading">
            <h2 id="language-title">${t("languagesTitle")}</h2>
            <p>${t("languagesDetail")}</p>
          </div>
          <label class="select-wrap" for="language-select">
            <select id="language-select" class="language-select" aria-label="${t("languagesTitle")}">
              ${languageOptions()
                .map(
                  (option) => `
                    <option value="${option.value}" ${preference === option.value ? "selected" : ""}>
                      ${option.label}
                    </option>
                  `
                )
                .join("")}
            </select>
          </label>
        </section>

        <section class="panel" aria-labelledby="shortcuts-title">
          <div class="section-heading">
            <h2 id="shortcuts-title">${t("shortcutsTitle")}</h2>
            <p>${t("shortcutsDetail")}</p>
          </div>
          <label class="toggle-row" for="shortcuts-enabled">
            <span>
              <strong>${t("shortcutsToggleTitle")}</strong>
            </span>
            <input id="shortcuts-enabled" type="checkbox" ${shortcutSettings.shortcutsEnabled ? "checked" : ""} />
          </label>
          <div class="shortcut-list">
            ${SIZE_PRESETS.map(
              (preset) => `
                <article class="shortcut-item">
                  <span>${t(preset.titleKey)}</span>
                  <kbd>${presetShortcuts[preset.id] || t("shortcutNotSet")}</kbd>
                </article>
              `
            ).join("")}
          </div>
          <p class="shortcut-note">${t("shortcutsManageHint")}</p>
        </section>

        <section class="panel" aria-labelledby="selection-position-title">
          <div class="section-heading">
            <h2 id="selection-position-title">${t("selectionPositionTitle")}</h2>
            <p>${t("selectionPositionDetail")}</p>
          </div>
          <label class="toggle-row" for="selection-position-enabled">
            <span>
              <strong>${t("selectionPositionToggleTitle")}</strong>
            </span>
            <input
              id="selection-position-enabled"
              type="checkbox"
              ${selectionPositionSettings.rememberSelectionPosition ? "checked" : ""}
            />
          </label>
        </section>

        <section class="panel" aria-labelledby="permissions-title">
          <div class="section-heading">
            <h2 id="permissions-title">${t("permissionsTitle")}</h2>
            <p>${t("permissionsDetail")}</p>
          </div>
          <div class="permission-list">
            ${permissionItems()
              .map(
                (item) => `
                  <article class="permission-item">
                    <span class="permission-key">${item.key}</span>
                    <p>${item.text}</p>
                  </article>
                `
            )
            .join("")}
          </div>
        </section>

        <section class="panel" aria-labelledby="about-title">
          <div class="section-heading">
            <h2 id="about-title">${t("aboutTitle")}</h2>
            <p>${t("aboutDetail")}</p>
          </div>
          <a
            class="repository-link"
            href="https://github.com/CEOYulinZhu/StoreShot"
            target="_blank"
            rel="noreferrer"
          >
            <img src="/icons/github.svg" alt="" aria-hidden="true" />
            <span>
              <strong>CEOYulinZhu/StoreShot</strong>
              <small>${t("aboutLicense")}</small>
            </span>
          </a>
        </section>
      </div>
    </main>
  `;

  appRoot.querySelector<HTMLSelectElement>("#language-select")?.addEventListener("change", (event) => {
    void updateLanguage((event.currentTarget as HTMLSelectElement).value as LocalePreference);
  });
  appRoot.querySelector<HTMLInputElement>("#shortcuts-enabled")?.addEventListener("change", (event) => {
    void updateShortcutsEnabled((event.currentTarget as HTMLInputElement).checked);
  });
  appRoot.querySelector<HTMLInputElement>("#selection-position-enabled")?.addEventListener("change", (event) => {
    void updateSelectionPositionEnabled((event.currentTarget as HTMLInputElement).checked);
  });
}

async function updateSelectionPositionEnabled(rememberSelectionPosition: boolean): Promise<void> {
  selectionPositionSettings = { rememberSelectionPosition };
  await saveSelectionPositionSettings(selectionPositionSettings);
  render();
}

async function updateLanguage(preference: LocalePreference): Promise<void> {
  await saveLocalePreference(preference);
  render();
}

function permissionItems(): Array<{ key: string; text: string }> {
  return [
    { key: "activeTab", text: t("permissionActiveTab") },
    { key: "scripting", text: t("permissionScripting") },
    { key: "downloads", text: t("permissionDownloads") },
    { key: "storage", text: t("permissionStorage") }
  ];
}

async function updateShortcutsEnabled(shortcutsEnabled: boolean): Promise<void> {
  shortcutSettings = { shortcutsEnabled };
  await saveShortcutSettings(shortcutSettings);
  render();
}

async function loadPresetShortcuts(): Promise<PresetShortcutMap> {
  try {
    return await getPresetShortcuts();
  } catch {
    return {};
  }
}

function languageOptions(): Array<{ value: LocalePreference; label: string }> {
  return [
    { value: "auto", label: t("languageAuto") },
    { value: "en", label: t("languageEnglish") },
    { value: "zh_CN", label: t("languageChinese") }
  ];
}
