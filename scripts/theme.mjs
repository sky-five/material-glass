// Theme generator.
//
//   node scripts/theme.mjs                         regenerate every theme in tokens/themes.config.json
//   node scripts/theme.mjs --name foo --seed #3366FF [--variant vibrant] [--secondary #hex] [--tertiary #hex]
//                          [--neutral-hue 230 --neutral-chroma 6] [--contrast 0.5] [--description "..."]
//   node scripts/theme.mjs --name foo --from-image photo.png [...]
//   add --dry to print the theme JSON without writing anything.
//
// Hand-tuned themes (no entry in themes.config.json) are never touched.
import * as mcu from '@material/material-color-utilities';
import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeTheme, seedFromPixels, VARIANTS } from '../src/theme-core.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = join(root, 'tokens/material-glass.tokens.json');
const configPath = join(root, 'tokens/themes.config.json');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
const config = JSON.parse(readFileSync(configPath, 'utf8'));

if (opt('name')) {
  const name = opt('name');
  if (!/^[a-z][a-z0-9-]*$/.test(name)) fail(`Theme name must be kebab-case: ${name}`);
  if (tokens.themes[name] && !config.themes[name]) fail(`"${name}" is a hand-tuned theme. Pick another name.`);
  let seed = opt('seed');
  if (opt('from-image')) {
    seed = seedFromPixels(mcu, decodePng(readFileSync(opt('from-image'))));
    console.log(`Seed from image: ${seed}`);
  }
  if (!seed || !/^#?[0-9a-f]{6}$/i.test(seed)) fail('Need --seed #RRGGBB or --from-image file.png');
  const variant = opt('variant') || 'tonal-spot';
  if (!VARIANTS[variant]) fail(`Unknown variant. Use one of: ${Object.keys(VARIANTS).join(', ')}`);
  const spec = { seed: seed.startsWith('#') ? seed : `#${seed}`, variant };
  if (opt('secondary')) spec.secondary = opt('secondary');
  if (opt('tertiary')) spec.tertiary = opt('tertiary');
  if (opt('neutral-hue')) spec.neutral = { hue: +opt('neutral-hue'), chroma: +(opt('neutral-chroma') ?? 4) };
  if (opt('contrast')) spec.contrast = +opt('contrast');
  if (opt('description')) spec.description = opt('description');
  config.themes[name] = spec;
}

const names = opt('name') ? [opt('name')] : Object.keys(config.themes);
for (const name of names) {
  const theme = makeTheme(mcu, config.themes[name]);
  if (flag('dry')) { console.log(JSON.stringify({ [name]: theme }, null, 2)); continue; }
  tokens.themes[name] = theme;
  console.log(`✓ ${name}  (${theme.$source.seed}, ${theme.$source.variant})`);
}

if (!flag('dry')) {
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  writeFileSync(tokensPath, JSON.stringify(tokens, null, 2) + '\n');
  console.log('\nTokens updated. Run `npm run build && npm test` next.');
}

function fail(msg) { console.error(`✗ ${msg}`); process.exit(1); }

// Minimal PNG decoder: 8-bit RGB/RGBA/greyscale, non-interlaced. Enough for seed extraction.
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) fail('Not a PNG file. Convert the image to PNG first.');
  let pos = 8, width, height, bitDepth, colorType, interlace;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (bitDepth !== 8 || !channels || interlace) fail('PNG must be 8-bit RGB/RGBA/grey and non-interlaced.');
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = new Uint8Array(width * height * 4);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[x] = v & 255;
    }
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4, s = x * channels;
      if (channels <= 2) { out[i] = out[i + 1] = out[i + 2] = cur[s]; out[i + 3] = channels === 2 ? cur[s + 1] : 255; }
      else { out[i] = cur[s]; out[i + 1] = cur[s + 1]; out[i + 2] = cur[s + 2]; out[i + 3] = channels === 4 ? cur[s + 3] : 255; }
    }
    prev = cur;
  }
  // Subsample big images; quantizing millions of pixels is slow and pointless.
  if (width * height <= 40000) return out;
  const step = Math.ceil(Math.sqrt((width * height) / 40000));
  const small = [];
  for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) { const i = (y * width + x) * 4; small.push(out[i], out[i + 1], out[i + 2], out[i + 3]); }
  return new Uint8Array(small);
}
