export type LocalePreference = "auto" | "en" | "zh_CN";
export type ResolvedLocale = Exclude<LocalePreference, "auto">;

type LocaleMessages = Record<string, string>;

// Manifest 的 _locales 用于浏览器商店识别，运行时 UI 则使用这里的消息表支持用户手动切换语言。
export const LOCALE_LABELS: Record<LocalePreference, string> = {
  auto: "Auto",
  en: "English",
  zh_CN: "简体中文"
};

export const MESSAGES: Record<ResolvedLocale, LocaleMessages> = {
  en: {
    popupTitle: "StoreShot",
    popupSubtitle: "Capture from the current page to create extension store assets at a specific size.",
    targetSize: "Target size",
    presets: "Presets",
    customSize: "Custom size",
    width: "Width",
    height: "Height",
    pixels: "px",
    startCapture: "Start capture",
    launching: "Starting...",
    openOptions: "Options",
    presetScreenshotTitle: "Screenshot",
    presetScreenshotDetail: "1280 x 800",
    presetPromoTitle: "Promo image",
    presetPromoDetail: "440 x 280",
    presetBannerTitle: "Wide image",
    presetBannerDetail: "1400 x 560",
    commandCaptureScreenshot: "Start a 1280 x 800 screenshot capture",
    commandCapturePromo: "Start a 440 x 280 promo image capture",
    commandCaptureBanner: "Start a 1400 x 560 wide image capture",
    customPresetTitle: "Custom",
    optionsTitle: "Settings",
    optionsIntro: "Configure StoreShot for a focused extension-store screenshot workflow.",
    permissionsTitle: "Permission statement",
    permissionsDetail: "StoreShot only requests the permissions needed for local capture and download.",
    permissionActiveTab: "Capture only the current visible tab after you start StoreShot.",
    permissionScripting: "Inject the selection overlay into the current tab.",
    permissionDownloads: "Save the generated PNG through browser downloads.",
    permissionStorage: "Remember your target size and language preference.",
    languagesTitle: "Language",
    languagesDetail: "Choose the display language for StoreShot UI. Auto follows the browser language.",
    languageAuto: "Auto",
    languageEnglish: "English",
    languageChinese: "简体中文",
    shortcutsTitle: "Shortcuts",
    shortcutsDetail: "Use keyboard shortcuts to start a preset capture without opening the popup.",
    shortcutsToggleTitle: "Enable preset shortcuts",
    shortcutNotSet: "Not set",
    shortcutsManageHint: "To change key combinations, open chrome://extensions/shortcuts in your browser.",
    aboutTitle: "Open source",
    aboutDetail: "View the project repository and license.",
    aboutLicense: "MIT License",
    errorNoActiveTab: "No active tab is available.",
    errorRestrictedPage:
      "This page cannot be captured. Try a normal website tab instead of a browser, store, or extension page.",
    errorInvalidSize: "Enter a valid numeric size.",
    errorSizeTooSmall: "Size must be at least 64 px on each side.",
    errorSizeTooLarge: "Size must be 8000 px or smaller on each side.",
    errorCaptureFailed: "Capture failed. Check page permissions and try again."
  },
  zh_CN: {
    popupTitle: "StoreShot",
    popupSubtitle: "从当前网页截图生成特定尺寸的扩展商店素材。",
    targetSize: "目标尺寸",
    presets: "常用预设",
    customSize: "自定义尺寸",
    width: "宽度",
    height: "高度",
    pixels: "像素",
    startCapture: "开始截图",
    launching: "启动中...",
    openOptions: "设置",
    presetScreenshotTitle: "截图",
    presetScreenshotDetail: "1280 x 800",
    presetPromoTitle: "宣传图",
    presetPromoDetail: "440 x 280",
    presetBannerTitle: "横幅图",
    presetBannerDetail: "1400 x 560",
    commandCaptureScreenshot: "开始 1280 x 800 截图",
    commandCapturePromo: "开始 440 x 280 宣传图截图",
    commandCaptureBanner: "开始 1400 x 560 横幅图截图",
    customPresetTitle: "自定义",
    optionsTitle: "设置",
    optionsIntro: "配置 StoreShot，让扩展商店截图制作更专注。",
    permissionsTitle: "权限声明",
    permissionsDetail: "StoreShot 只申请本地截图和下载所需的权限。",
    permissionActiveTab: "仅在你启动 StoreShot 后截取当前可见标签页。",
    permissionScripting: "向当前标签页注入截图选择层。",
    permissionDownloads: "通过浏览器下载功能保存生成的 PNG。",
    permissionStorage: "记住目标尺寸和语言偏好。",
    languagesTitle: "语言",
    languagesDetail: "选择 StoreShot 界面语言。自动模式会跟随浏览器语言。",
    languageAuto: "自动",
    languageEnglish: "English",
    languageChinese: "简体中文",
    shortcutsTitle: "快捷键",
    shortcutsDetail: "使用键盘快捷键，无需打开 popup 即可按预设开始截图。",
    shortcutsToggleTitle: "启用预设快捷键",
    shortcutNotSet: "未设置",
    shortcutsManageHint: "如需修改按键组合，请在浏览器中打开 chrome://extensions/shortcuts。",
    aboutTitle: "开源项目",
    aboutDetail: "查看项目仓库和开源协议。",
    aboutLicense: "MIT 开源协议",
    errorNoActiveTab: "没有可用的当前标签页。",
    errorRestrictedPage: "当前页面无法截图。请在普通网站页面使用，不要在浏览器、商店或扩展页面使用。",
    errorInvalidSize: "请输入有效的数字尺寸。",
    errorSizeTooSmall: "宽高每边至少需要 64 像素。",
    errorSizeTooLarge: "宽高每边不能超过 8000 像素。",
    errorCaptureFailed: "截图失败，请检查页面权限后重试。"
  }
};

export function resolveLocale(preference: LocalePreference, browserLanguage = ""): ResolvedLocale {
  // 目前只内置英文和简体中文；自动模式下，其他语言统一回落到英文。
  if (preference !== "auto") {
    return preference;
  }

  return browserLanguage.toLowerCase().startsWith("zh") ? "zh_CN" : "en";
}
