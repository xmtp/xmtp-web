import { defineConfig } from "rollup";
import { dts } from "rollup-plugin-dts";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";

export default defineConfig([
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.d.ts",
      format: "es",
    },
    plugins: [tsConfigPaths(), dts()],
  },
]);
