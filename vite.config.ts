import { defineConfig } from "vite";

export default defineConfig({
  root: "playground",
  base: "/move-it/",
  build: {
    outDir: "../dist-playground",
    emptyOutDir: true,
  },
});