import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: false,
    lib: {
      entry: resolve(__dirname, "src/content/index.ts"),
      name: "StoreShotContent",
      formats: ["iife"],
      fileName: () => "content.js"
    }
  }
});
