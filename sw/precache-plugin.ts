import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin, ResolvedConfig, Rollup } from 'vite';
import { PYODIDE_DIR, pyodideVersion } from './pyodide-plugin';

// Builds dist/sw.js from sw/sw.template.js: fills in a version (a hash of the build output, so
// every deploy gets a fresh 'intprep-<version>' cache and new sw.js bytes) and the list of files
// the worker downloads when it installs.

const TEMPLATE = 'sw/sw.template.js';
const PLACEHOLDER = 'const BUILD = __BUILD__;';

// Fonts precached so Latin text renders offline from the first visit. Other unicode-range
// subsets (Cyrillic, Greek, Vietnamese) and the .woff fallbacks are cached when first used.
const PRECACHE_FONTS = [
  'inter-latin-wght-normal.woff2',
  'inter-latin-ext-wght-normal.woff2',
  'jetbrains-mono-latin-400-normal.woff2',
  'jetbrains-mono-latin-ext-400-normal.woff2',
  'jetbrains-mono-latin-500-normal.woff2',
  'jetbrains-mono-latin-ext-500-normal.woff2',
];

/** Every file under `dir`, as sorted '/'-separated paths relative to it. */
function listFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => relative(dir, join(d.parentPath, d.name)).split(sep).join('/'))
    .sort();
}

export function precacheServiceWorker(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'intprep:precache-sw',
    apply: 'build',
    configResolved(resolved) {
      config = resolved;
    },
    generateBundle: {
      order: 'post', // after Vite has emitted index.html
      handler(_options, bundle) {
        const template = readFileSync(resolve(config.root, TEMPLATE), 'utf8');
        if (template.split(PLACEHOLDER).length !== 2) this.error(`${TEMPLATE} must contain "${PLACEHOLDER}" once`);

        // public/ (manifest + icons) is copied to dist as-is, outside the bundle.
        const publicDir = config.publicDir;
        const publicFiles = new Map((publicDir ? listFiles(publicDir) : []).map((f) => [f, readFileSync(join(publicDir, f))]));
        if (publicFiles.has('sw.js')) this.error(`public/sw.js would replace the generated worker; edit ${TEMPLATE}`);
        // The worker treats everything under assets/ as content-hashed (never stale).
        const assetsDir = `${config.build.assetsDir}/`;
        if ([...publicFiles.keys()].some((f) => f.startsWith(assetsDir))) this.error(`public/${assetsDir} must stay empty`);

        // The Python runtime (pyodide/) is neither precached nor part of the version: it is fetched
        // when code is first run and kept in its own cache, named by its own version.
        const outputs = Object.values(bundle)
          .filter((o) => !o.fileName.startsWith(PYODIDE_DIR))
          .sort((a, b) => (a.fileName < b.fileName ? -1 : 1));
        const html = bundle['index.html'];
        if (html?.type !== 'asset') this.error('index.html is missing from the bundle');
        const chunks = outputs.filter((o): o is Rollup.OutputChunk => o.type === 'chunk');
        const assets = outputs.filter((o): o is Rollup.OutputAsset => o.type === 'asset');
        const entry = chunks.find((c) => c.isEntry);
        if (!entry) this.error('no entry chunk');
        // Chunks the entry imports statically (the content chunk, see vite.config.ts) load with the
        // page. Any other chunk is lazy: old tabs keep running after an update, but the previous
        // deploy's cache is deleted when the new worker takes over, so a lazy chunk an old tab
        // asks for later is gone.
        const byName = new Map(chunks.map((c) => [c.fileName, c]));
        const eager = new Set<string>();
        const visit = (c: Rollup.OutputChunk | undefined) => {
          if (!c || eager.has(c.fileName)) return;
          eager.add(c.fileName);
          c.imports.forEach((f) => visit(byName.get(f)));
        };
        visit(entry);
        // Two kinds of lazy chunk are expected, and the app does without them when they cannot be
        // loaded (lib/traces.ts shows a note, lib/python.ts falls back to comparing code): the
        // step-by-step traces, a file per unit, and the tests of "run my code". Any other lazy
        // chunk is new: check that the screen using it survives a failed import.
        const known = (c: Rollup.OutputChunk) => c.moduleIds.some((id) => /\/src\/content\/(traces|tests)\//.test(id));
        const lazy = chunks.filter((c) => !eager.has(c.fileName) && !known(c));
        if (lazy.length) {
          this.warn(`${lazy.length} unexpected lazy JS chunk(s) (${lazy.map((c) => c.name).join(', ')}): old tabs can't load them after an update; see ${TEMPLATE}`);
        }
        const fonts = PRECACHE_FONTS.map((name) => {
          const font = assets.find((a) => a.names.includes(name));
          if (!font) this.error(`font ${name} not found in the build; update PRECACHE_FONTS in sw/precache-plugin.ts`);
          return font;
        });
        const css = assets.filter((a) => a.fileName.endsWith('.css'));
        // The web worker that runs Python is built as an asset, not a chunk. Precached with the app,
        // so "run my code" works offline (once the runtime itself has been fetched) and a worker
        // that was stopped can be started again.
        const workers = assets.filter((a) => /\.js$/.test(a.fileName) && a.fileName.startsWith(assetsDir) && !a.fileName.endsWith('.map'));

        // The page is cached once, as './' (served for index.html too).
        const precache = [
          './',
          ...chunks.map((c) => c.fileName),
          ...workers.map((a) => a.fileName),
          ...css.map((a) => a.fileName),
          ...fonts.map((a) => a.fileName),
          ...publicFiles.keys(),
        ];

        // Hashed file names stand for their contents; index.html, the public files and the
        // template aren't hashed, so their contents go in too.
        const hash = createHash('sha256').update(template);
        for (const o of outputs) hash.update(`\0${o.fileName}`);
        hash.update(html.source);
        for (const [file, data] of publicFiles) hash.update(`\0${file}\0`).update(data);
        const version = hash.digest('hex').slice(0, 12);

        const build = { version, entry: entry.fileName, assetsDir, precache, python: { dir: PYODIDE_DIR, version: pyodideVersion() } };
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: template.replace(PLACEHOLDER, () => `const BUILD = ${JSON.stringify(build, null, 2)};`),
        });

        const size = (o: Rollup.OutputChunk | Rollup.OutputAsset) => Buffer.byteLength(o.type === 'chunk' ? o.code : o.source);
        let bytes = [...chunks, ...workers, ...css, ...fonts, html].reduce((n, o) => n + size(o), 0);
        for (const data of publicFiles.values()) bytes += data.length;
        config.logger.info(`sw.js: cache intprep-${version}, precaching ${precache.length} files (${(bytes / 1024).toFixed(0)} kB)`);
      },
    },
  };
}
