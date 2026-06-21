import { defineConfig } from "tsup";
import { cpSync } from "node:fs";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs", "iife"],
  globalName: "MoveIt",
  target: "es2020",
  clean: true,
  splitting: false,
  loader: {
    ".css": "text"
  },
  onSuccess: async () => {
    // Copy the raw stylesheet for consumers who want the
    // "move-it/control.css" subpath export (e.g. a <link> tag)
    // instead of the JS-injected, inlined version.
    cpSync("src/dom/control.css", "dist/control.css");
  },
});