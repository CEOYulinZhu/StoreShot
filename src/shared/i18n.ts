import { getChrome } from "./chrome";
import { MESSAGES, resolveLocale, type LocalePreference, type ResolvedLocale } from "./locales";

const LANGUAGE_KEY = "storeshot.language";

let localePreference: LocalePreference = "auto";
let resolvedLocale: ResolvedLocale = "en";

export function t(key: string, substitutions?: string | string[]): string {
  // 优先使用本地 messages 常量，只有缺失时才回退到 chrome.i18n，避免选项页和弹窗在无扩展上下文时失语。
  const localMessage = MESSAGES[resolvedLocale]?.[key];
  if (localMessage) {
    return applySubstitutions(localMessage, substitutions);
  }

  try {
    const message = getChrome().i18n.getMessage(key, substitutions);
    return message || key;
  } catch {
    return key;
  }
}

export function localizeDocumentTitle(key: string): void {
  document.title = t(key);
}

export async function loadLocalePreference(): Promise<LocalePreference> {
  const data = await getChrome().storage.sync.get(LANGUAGE_KEY);
  const value = data[LANGUAGE_KEY];
  localePreference = isLocalePreference(value) ? value : "auto";
  // “自动”模式由浏览器语言解析成最终界面语言，这样界面和系统语言保持一致。
  resolvedLocale = resolveLocale(localePreference, getChrome().i18n.getUILanguage?.() ?? navigator.language);
  return localePreference;
}

export async function saveLocalePreference(preference: LocalePreference): Promise<void> {
  localePreference = preference;
  resolvedLocale = resolveLocale(preference, getChrome().i18n.getUILanguage?.() ?? navigator.language);
  await getChrome().storage.sync.set({ [LANGUAGE_KEY]: preference });
}

export function getLocalePreference(): LocalePreference {
  return localePreference;
}

function isLocalePreference(value: unknown): value is LocalePreference {
  return value === "auto" || value === "en" || value === "zh_CN";
}

function applySubstitutions(message: string, substitutions?: string | string[]): string {
  if (!substitutions) {
    return message;
  }

  const values = Array.isArray(substitutions) ? substitutions : [substitutions];
  return values.reduce((result, value, index) => result.replaceAll(`$${index + 1}`, value), message);
}
