// Bundles the framework backend's consumed public surface to dist/ as
// node-runnable ESM. Framework source mixes .ts and legacy .js with
// moduleResolution:bundler and extensionless imports, so it can't run under
// plain `node` after a bare tsc emit. esbuild bundles each consumed entry
// (resolving those imports) while keeping npm dependencies external so they
// resolve from node_modules at runtime. Code splitting shares common relative
// modules so module-level singletons (e.g. the sqlite pool) are not duplicated.
//
// Scope: only the subpaths consumers actually import today
// (shared/helpers/*, api/base/SchemaDefinition). The framework's barrel
// index and some api/middleware+examples files are legacy/broken CJS that no
// consumer imports; bundling them would fail. Add dirs here as real imports grow.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

const root = dirname(fileURLToPath(import.meta.url));
const includeDirs = ['shared/helpers', 'api/base'];

const entryPoints = includeDirs
  .filter((d) => existsSync(join(root, d)))
  .flatMap((d) =>
    readdirSync(join(root, d), { recursive: true })
      .map((f) => `${d}/${String(f).replaceAll('\\', '/')}`)
      .filter((f) => /\.(ts|js)$/.test(f))
      .filter((f) => !/\.(d\.ts|test\.(ts|js))$/.test(f)),
  )
  .map((f) => join(root, f));

await build({
  entryPoints,
  outbase: root,
  outdir: join(root, 'dist'),
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  packages: 'external', // leave better-sqlite3, joi, winston, mcp sdk, node: builtins external
  sourcemap: true,
  logLevel: 'info',
});
