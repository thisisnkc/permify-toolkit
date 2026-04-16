import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/base.ts",
    "src/helpers.ts",
    "src/commands/**/*.ts"
  ],
  format: ["esm", "cjs"],
  dts: true,
  outDir: "dist",
  clean: true,
  splitting: false,
  outExtension({ format }) {
    return { js: format === "esm" ? ".mjs" : ".cjs" };
  }
});
