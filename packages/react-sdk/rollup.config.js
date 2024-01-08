import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";
import terser from "@rollup/plugin-terser";
import filesize from "rollup-plugin-filesize";

export default defineConfig([
  {
    input: "src/index.ts",
    output: {
      file: "lib/index.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      tsConfigPaths(),
      typescript({
        declaration: false,
        declarationMap: false,
      }),
      terser(),
      filesize({
        showMinifiedSize: false,
      }),
    ],
    external: [
      "@xmtp/content-type-reaction",
      "@xmtp/content-type-read-receipt",
      "@xmtp/content-type-remote-attachment",
      "@xmtp/content-type-reply",
      "@xmtp/xmtp-js",
      "async-mutex",
      "date-fns",
      "dexie-react-hooks",
      "dexie",
      "react",
      "react/jsx-runtime",
      "uuid",
      "zod",
    ],
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
