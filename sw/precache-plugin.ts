import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin, ResolvedConfig, Rollup } from 'vite';

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

        const outputs = Object.values(bundle).sort((a, b) => (a.fileName < b.fileName ? -1 : 1));
        const html = bundle['index.html'];
        if (html?.type !== 'asset') this.error('index.html is missing from the bundle');
        const chunks = outputs.filter((o): o is Rollup.OutputChunk => o.type === 'chunk');
        const assets = outputs.filter((o): o is Rollup.OutputAsset => o.type === 'asset');
        const entry = chunks.find((c) => c.isEntry);
        if (!entry) this.error('no entry chunk');
        if (chunks.length > 1) {
          // Old tabs keep running after an update, but the previous deploy's cache is deleted
          // when the new worker takes over, so a lazy chunk an old tab asks for later is gone.
          this.warn(`${chunks.length} JS chunks: old tabs can't load lazy chunks after an update; see ${TEMPLATE}`);
        }
        const fonts = PRECACHE_FONTS.map((name) => {
          const font = assets.find((a) => a.names.includes(name));
          if (!font) this.error(`font ${name} not found in the build; update PRECACHE_FONTS in sw/precache-plugin.ts`);
          return font;
        });
        const css = assets.filter((a) => a.fileName.endsWith('.css'));

        // The page is cached once, as './' (served for index.html too).
        const precache = ['./', ...chunks.map((c) => c.fileName), ...css.map((a) => a.fileName), ...fonts.map((a) => a.fileName), ...publicFiles.keys()];

        // Hashed file names stand for their contents; index.html, the public files and the
        // template aren't hashed, so their contents go in too.
        const hash = createHash('sha256').update(template);
        for (const o of outputs) hash.update(`\0${o.fileName}`);
        hash.update(html.source);
        for (const [file, data] of publicFiles) hash.update(`\0${file}\0`).update(data);
        const version = hash.digest('hex').slice(0, 12);

        const build = { version, entry: entry.fileName, assetsDir, precache };
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: template.replace(PLACEHOLDER, () => `const BUILD = ${JSON.stringify(build, null, 2)};`),
        });

        const size = (o: Rollup.OutputChunk | Rollup.OutputAsset) => Buffer.byteLength(o.type === 'chunk' ? o.code : o.source);
        let bytes = [...chunks, ...css, ...fonts, html].reduce((n, o) => n + size(o), 0);
        for (const data of publicFiles.values()) bytes += data.length;
        config.logger.info(`sw.js: cache intprep-${version}, precaching ${precache.length} files (${(bytes / 1024).toFixed(0)} kB)`);
      },
    },
  };
}
