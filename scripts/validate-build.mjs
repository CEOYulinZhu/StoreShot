import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
// 这里校验的是扩展发布包的最低可用结构，不替代浏览器里的真实手工验证。
const requiredFiles = [
  "manifest.json",
  "background.js",
  "content.js",
  "popup.html",
  "options.html",
  "_locales/en/messages.json",
  "_locales/zh_CN/messages.json",
  "icons/icon128.png"
];

const missing = requiredFiles.filter((file) => !existsSync(join(dist, file)));
if (missing.length > 0) {
  throw new Error(`Build validation failed. Missing files: ${missing.join(", ")}`);
}

const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
const contentScript = readFileSync(join(dist, "content.js"), "utf8");

// 权限和国际化是 StoreShot 的可信边界：构建产物不应悄悄扩大 host 权限或丢失语言声明。
assert(manifest.manifest_version === 3, "manifest_version must be 3.");
assert(manifest.default_locale === "en", "default_locale must be en.");
assert(manifest.version === "1.0.0", "manifest version must be 1.0.0.");
assert(manifest.name === "__MSG_extensionName__", "manifest name must use __MSG_extensionName__.");
assert(
  manifest.description === "__MSG_extensionDescription__",
  "manifest description must use __MSG_extensionDescription__."
);
assert(Array.isArray(manifest.permissions), "permissions must be declared.");

for (const permission of ["activeTab", "scripting", "downloads", "storage"]) {
  assert(manifest.permissions.includes(permission), `missing required permission: ${permission}`);
}

assert(!manifest.host_permissions, "host_permissions should not be requested.");
assert(
  !/\b(?:import|export)\s*(?:\{|\*|default|["'])/.test(contentScript),
  "content.js must be a classic script without ESM import/export syntax."
);
for (const size of ["16", "32", "48", "128"]) {
  assert(manifest.icons?.[size] === "icons/icon128.png", `icon ${size} must point to icon128.png.`);
}

for (const locale of ["en", "zh_CN"]) {
  const messages = JSON.parse(readFileSync(join(dist, `_locales/${locale}/messages.json`), "utf8"));
  for (const key of ["extensionName", "extensionDescription", "startCapture", "confirmCapture"]) {
    assert(messages[key]?.message, `${locale} missing message key: ${key}`);
  }
}

console.log("Build validation passed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
