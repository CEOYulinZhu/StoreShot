# StoreShot

StoreShot 是一个 Manifest V3 浏览器扩展，用来把当前网页的可见区域快速裁剪成指定尺寸的 PNG。它尤其适合制作 Chrome Web Store、Microsoft Edge Add-ons 等扩展商店需要的截图、宣传图和横幅图。

![StoreShot 工作流概览](https://i.postimg.cc/DyMNGRK6/01-html-storeshot-overview.png)

## 适合什么场景

- 用 AI 或手写 HTML 做一个商店展示页，再按商店尺寸导出图片。
- 从真实页面中框选一块区域，生成 `1280 x 800`、`440 x 280`、`1400 x 560` 等常见素材。
- 临时需要特殊比例时，输入自定义宽高并保持选区比例一致。
- 希望只在主动点击扩展时截图，不给扩展配置宽泛网站访问权限。

## 推荐工作流

### 1. 让 AI 生成 HTML 页面

先准备截图素材、产品图标和页面布局，让 AI 生成一个适合展示的 HTML 页面。你也可以直接使用已有网页、落地页或本地预览页。

![AI 生成 HTML 页面](https://i.postimg.cc/cJZBtcrN/02-ai-writes-html.png)

### 2. 在浏览器中预览页面

打开生成的 HTML，检查文案、图片、间距和最终构图。StoreShot 截取的是当前可见视口，所以截图前请把页面滚动到想要的位置。

![预览 HTML 页面](https://i.postimg.cc/3NyXQSbD/03-preview-html.png)

### 3. 用 StoreShot 指定尺寸截图

点击 StoreShot，选择预设或自定义尺寸，在页面上移动、缩放选区，然后导出 PNG。扩展会按目标尺寸裁剪和缩放，下载得到可直接用于商店素材的图片。

![StoreShot 指定尺寸截图](https://i.postimg.cc/GhyFMfDd/04-storeshot-capture.png)

## 截图演示

![StoreShot 产品演示](https://i.postimg.cc/7ZpXmyDX/Store-Shot-Demo.png)

## 核心能力

- 常用商店尺寸预设：`1280 x 800`、`440 x 280`、`1400 x 560`。
- 自定义尺寸：每边 `64` 到 `8000` 像素。
- 页面内可拖拽、移动、四角缩放选区，并保持目标宽高比。
- 导出 PNG 时自动把 CSS 像素选区换算到截图位图坐标。
- 保存最近使用的尺寸和语言偏好。
- 可按网站和目标尺寸记住上次成功导出的选区位置，并可在设置中关闭。
- 支持英文和简体中文界面。

## 安装与本地加载

```bash
npm install
npm run build
```

然后在浏览器中加载构建产物：

1. 打开 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions`。
2. 开启开发者模式。
3. 点击“加载已解压的扩展”。
4. 选择本项目生成的 `dist` 目录。

## 使用方法

1. 打开一个普通网页标签页。
2. 点击 StoreShot 扩展图标。
3. 选择预设尺寸，或输入自定义宽高。
4. 点击“开始截图”。
5. 在页面上调整选区。
6. 点击“导出 PNG”，保存生成的图片。

注意：StoreShot 只截取当前可见视口。浏览器内部页面、扩展页面、扩展商店页面等受限制页面可能无法注入选择层或截图。

## 权限说明

StoreShot 不声明 `host_permissions`，不会默认访问所有网站。它只在用户主动发起截图时使用当前标签页。

| 权限 | 用途 |
| --- | --- |
| `activeTab` | 在用户点击扩展后访问当前活动标签页。 |
| `scripting` | 按需向当前页面注入选择层。 |
| `downloads` | 保存生成的 PNG。 |
| `storage` | 记住最近使用的尺寸、语言偏好和按网站隔离的选区位置。 |

## 开发

```bash
npm run dev        # 调试 popup/options 页面
npm run typecheck  # TypeScript 类型检查
npm run build      # 类型检查、生产构建、校验 dist
npm run validate   # 校验已生成的 dist 扩展结构
```

主要目录：

```text
public/                 Manifest、图标和浏览器扩展国际化资源
src/popup/              扩展弹窗
src/content/            页面选区覆盖层
src/background/         截图、裁剪、下载流程
src/shared/             消息、尺寸、存储、国际化和图像工具
scripts/validate-build.mjs
```

构建会输出到 `dist/`。请不要直接修改构建产物，改源码后通过 `npm run build` 生成。

## 许可协议

本项目基于 [MIT License](LICENSE) 开源。
