import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      // 页面入口和模块化 background 共享构建；经典脚本 content 由独立配置内联生成。
      input: {
        popup: resolve(__dirname, "popup.html"),
        options: resolve(__dirname, "options.html"),
        background: resolve(__dirname, "src/background/index.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "[name][extname]"
      }
    }
  }
});
