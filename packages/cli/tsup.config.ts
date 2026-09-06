import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  // Empacota os pacotes do workspace para a CLI ser distribuível standalone.
  noExternal: [/^@simdeploy\//],
  banner: { js: "#!/usr/bin/env node" },
});
