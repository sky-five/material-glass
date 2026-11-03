// Builds dist/index.js (ESM, "use client") with esbuild and dist/index.d.ts with tsc.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [join(here, 'src/index.tsx')],
  outfile: join(here, 'dist/index.js'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2020',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  banner: { js: "'use client';" },
  logLevel: 'warning'
});
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
execFileSync(process.execPath, [tsc, '-p', join(here, 'tsconfig.json')], { stdio: 'inherit' });
console.log('@material-glass/react: dist/index.js + dist/index.d.ts');
