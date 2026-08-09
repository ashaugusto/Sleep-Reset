/**
 * Runs one file out of src/scripts.
 *
 * The scripts import @workspace/db, and bare node cannot follow that: the
 * package's entry does `import * as schema from "./schema"`, a directory
 * import, which ESM does not resolve. The server never hits this because
 * build.mjs bundles it away with esbuild first. So do the same thing here,
 * one file at a time, instead of leaving the scripts folder unrunnable.
 *
 *   node --env-file=../../.env run-script.mjs seed-review-account
 *
 * or, through the workspace:
 *
 *   pnpm --filter @workspace/api-server run script seed-review-account
 *
 * Env comes from the caller (--env-file, or an exported variable), same as the
 * systemd unit does for the server itself.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync, rmSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { build } from "esbuild";

const here = path.dirname(fileURLToPath(import.meta.url));

const name = process.argv[2];
if (!name) {
  console.error("Usage: node run-script.mjs <name-of-file-in-src/scripts>");
  process.exit(1);
}

const entry = path.resolve(here, "src/scripts", name.replace(/\.ts$/, "") + ".ts");
if (!existsSync(entry)) {
  console.error(`No such script: ${entry}`);
  process.exit(1);
}

const outDir = await mkdtemp(path.join(tmpdir(), "api-script-"));
const outfile = path.join(outDir, "script.mjs");

try {
  await build({
    entryPoints: [entry],
    outfile,
    platform: "node",
    format: "esm",
    bundle: true,
    sourcemap: "inline",
    logLevel: "warning",
    external: ["pg-native", "*.node"],
    banner: {
      js: `import { createRequire as __cr } from 'node:module';
globalThis.require = __cr('${pathToFileURL(path.join(here, "index.js")).href}');`,
    },
  });

  await import(pathToFileURL(outfile).href);
} finally {
  // The imported module is still running here — it closes its own pool and
  // exits on its own schedule — so the bundle has to survive until the process
  // does.
  process.on("exit", () => rmSync(outDir, { recursive: true, force: true }));
}
