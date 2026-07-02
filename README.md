# StoreShot

StoreShot 是一个 Manifest V3 浏览器扩展，用于在当前网页上选择可见区域，并导出严格匹配目标尺寸的 PNG，方便制作 Chrome Web Store 与 Microsoft Edge Add-ons 等扩展商店素材。

它面向需要反复准备商店截图、宣传图或横幅图的扩展开发者。StoreShot 不截取整页，也不请求宽泛站点权限；它只在用户主动点击扩展后，对当前标签页注入选择层，截取当前可见视口并按目标尺寸裁剪、缩放、下载。

## 功能特性

- 在 popup 中选择常用尺寸或输入自定义尺寸。
- 在页面内拖拽、移动、四角缩放选区，并保持目标宽高比。
- 通过后台脚本调用 `chrome.tabs.captureVisibleTab` 截取当前可见视口。
- 将 CSS 像素选区换算为截图位图坐标，再用 `OffscreenCanvas` 裁剪并缩放为目标 PNG。
- 通过浏览器下载能力保存文件，默认文件名位于 `StoreShot/` 下载子目录。
- 记住最近使用的尺寸与语言偏好。
- 支持英文与简体中文界面，并通过 Manifest 国际化字段声明扩展名称和描述。

## 使用场景

- 为扩展商店准备 `1280 x 800` 截图。
- 为列表页准备 `440 x 280` 宣传图。
- 为横幅或宽图场景准备 `1400 x 560` 图片。
- 在商店要求变化或存在特殊展示需求时，使用 `64 x 64` 到 `8000 x 8000` 范围内的自定义尺寸。

## 安装与本地加载

项目当前没有声明已发布到扩展商店。你可以通过本地构建产物加载：

```bash
npm install
npm run build
```

然后在浏览器中加载 `dist` 目录：

1. 打开 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions`。
2. 开启开发者模式。
3. 点击“加载已解压的扩展”。
4. 选择本项目生成的 `dist` 目录。

## 使用方法

1. 打开一个普通网页标签页。
2. 点击 StoreShot 扩展图标。
3. 选择预设尺寸，或切换到自定义尺寸并输入宽高。
4. 点击“开始截图”。
5. 在页面上移动或缩放选区。
6. 点击“导出 PNG”，在浏览器下载确认后保存文件。

注意：StoreShot 只能截取当前可见视口。浏览器内部页面、扩展页面、扩展商店页面等受限制页面可能拒绝脚本注入或截图。

## 技术栈

- 浏览器扩展：Manifest V3
- 语言：TypeScript
- 构建工具：Vite
- UI：原生 DOM 与 CSS，无前端运行时框架
- 国际化：Manifest `_locales` 与项目内消息表
- 图像处理：`createImageBitmap`、`OffscreenCanvas`、Canvas 2D API

主要脚本：

```bash
npm run dev        # 启动 Vite 开发服务，适合调试 popup/options 页面
npm run typecheck  # 执行 TypeScript 类型检查
npm run build      # 类型检查、生产构建，并校验 dist 扩展结构
npm run validate   # 校验已生成的 dist 扩展结构
```

## 项目结构

```text
.
├── public/
│   ├── manifest.json              # Manifest V3 扩展清单
│   ├── _locales/                  # 浏览器扩展国际化消息
│   └── icons/                     # 扩展图标
├── scripts/
│   └── validate-build.mjs         # 构建产物结构与权限校验
├── src/
│   ├── background/index.ts        # 后台截图、裁剪、下载流程入口
│   ├── content/index.ts           # 页面选区遮罩、拖拽缩放与消息发送
│   ├── content/overlay.css        # 注入页面的 Shadow DOM 样式
│   ├── options/                   # 设置页入口与样式
│   ├── popup/                     # 扩展弹窗入口与样式
│   ├── shared/                    # 消息、尺寸、存储、国际化与图像工具
│   └── styles/tokens.css          # popup/options 共享样式变量
├── popup.html                     # popup HTML 入口
├── options.html                   # options HTML 入口
├── vite.config.ts                 # Vite 多入口构建配置
└── tsconfig.json                  # TypeScript 配置
```

## 核心流程

1. 用户在 `popup` 中选择目标尺寸。
2. `src/popup/main.ts` 将尺寸保存到 `chrome.storage.sync`，并向当前活动标签页发送 `STORESHOT_START_SELECTION`。
3. 如果页面尚未注入内容脚本，popup 通过 `chrome.scripting.executeScript` 注入 `content.js` 后重发消息。
4. `src/content/index.ts` 在页面中创建 Shadow DOM 覆盖层，用户可移动或按目标比例缩放选区。
5. 用户确认导出时，content script 先隐藏覆盖层，再向后台发送 `STORESHOT_CAPTURE_SELECTION`，包含选区、视口尺寸和目标尺寸。
6. `src/background/index.ts` 调用 `chrome.tabs.captureVisibleTab` 获取当前可见视口截图。
7. `src/shared/image.ts` 将选区 CSS 像素换算到真实截图位图坐标，裁剪并缩放到目标宽高。
8. 后台脚本通过 `chrome.downloads.download` 保存 PNG。

## 权限说明

`public/manifest.json` 声明了以下权限：

| 权限 | 用途 |
| --- | --- |
| `activeTab` | 只在用户点击扩展并发起操作后访问当前活动标签页。 |
| `scripting` | 按需向当前标签页注入轻量选择层。 |
| `downloads` | 将生成的 PNG 交给浏览器下载管理器保存。 |
| `storage` | 保存最近使用的尺寸和语言偏好。 |

项目没有声明 `host_permissions`，也不会默认访问所有网站。截图能力受浏览器自身限制约束，内部页面、扩展页面和部分受保护页面可能无法使用。

## 配置与尺寸规则

- 默认尺寸：`1280 x 800`。
- 内置预设：`1280 x 800`、`440 x 280`、`1400 x 560`。
- 自定义尺寸范围：每边最小 `64` 像素，最大 `8000` 像素。
- 页面选区最小尺寸：`80 x 80` CSS 像素。
- 构建输出目录：`dist/`。
- 扩展版本：由 `public/manifest.json` 中的 `version` 控制，当前为 `1.0.0`。

## 国际化

StoreShot 当前包含两套语言资源：

- `public/_locales/en/messages.json`
- `public/_locales/zh_CN/messages.json`

Manifest 使用 `__MSG_extensionName__` 与 `__MSG_extensionDescription__` 声明商店可识别的扩展名称和描述。popup 与 options 页面还会读取 `src/shared/locales.ts` 中的消息表，以支持用户在设置页中选择自动、英文或简体中文。

## 质量保障

推荐在提交前运行：

```bash
npm run typecheck
npm run build
```

`npm run build` 会执行：

1. TypeScript 类型检查。
2. Vite 生产构建。
3. `scripts/validate-build.mjs` 构建产物校验。

校验脚本会检查 `dist` 中的 Manifest V3、关键入口文件、权限声明、无宽泛 host 权限、语言文件和图标文件。它不能替代浏览器内手工验证；发布前仍应在 Chrome 或 Edge 中加载 `dist`，完成一次真实截图导出，并检查 PNG 尺寸是否符合目标尺寸。

## 贡献指南

- 修改前先理解 `popup -> content -> background -> shared/image` 的主流程。
- 保持权限最小化，不要在没有明确必要性的情况下新增 `host_permissions` 或敏感权限。
- 不要直接修改 `dist/`，应修改源码后通过 `npm run build` 生成产物。
- 新增用户可见文案时，同步更新 `_locales` 与 `src/shared/locales.ts`。
- 对截图、坐标换算、消息通信、存储兼容等非显而易见逻辑添加简洁注释；不要逐行翻译代码。
- 提交前至少运行 `npm run typecheck` 和 `npm run build`。

## 截图与演示

仓库当前未包含可引用的截图或演示资源。建议后续补充：

- popup 尺寸选择界面截图。
- 页面选区覆盖层截图。
- 一张导出 PNG 与目标尺寸检查示例。

## 许可协议

当前仓库未发现 `LICENSE` 或同类许可文件。开源发布前建议补充明确的许可证，并在 README 中引用对应协议。
