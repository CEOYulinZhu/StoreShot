export type ChromeApi = typeof chrome;

export function getChrome(): ChromeApi {
  if (typeof chrome === "undefined") {
    throw new Error("Chrome extension APIs are unavailable in this context.");
  }

  return chrome;
}
