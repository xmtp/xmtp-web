import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";
import terser from "@rollup/plugin-terser";
import filesize from "rollup-plugin-filesize";

const plugins = [
  tsConfigPaths(),
  typescript({
    declaration: false,
    declarationMap: false,
  }),
  // terser(),
  filesize({
    showMinifiedSize: false,
  }),
];

const external = [
  "@xmtp/content-type-text",
  "@xmtp/client-bindings-wasm",
  "@xmtp/content-type-primitives",
  "@xmtp/proto",
  "uuid",
];

export default defineConfig([
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.js",
      format: "es",
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: "src/workers/client.ts",
    output: {
      file: "lib/workers/client.js",
      format: "es",
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: "src/workers/helpers.ts",
    output: {
      file: "lib/workers/helpers.js",
      format: "es",
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.d.ts",
      format: "es",
    },
    plugins: [tsConfigPaths(), dts()],
  },
]);
