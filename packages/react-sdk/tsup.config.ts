import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  outDir: "lib",
  splitting: false,
  sourcemap: true,
  treeshake: true,
  clean: true,
  bundle: true,
  minify: !options.watch,
  dts: true,
  platform: "browser",
  format: ["cjs", "esm"],
}));
