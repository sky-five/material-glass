// Style Dictionary: DTCG tokens → Swift (iOS), Kotlin/Compose (Android) and Dart (Flutter).
// Run scripts/export-tokens.mjs first (npm run tokens does both).
//   dist/platforms/ios/MaterialGlass<Theme><Mode>.swift
//   dist/platforms/android/MaterialGlass<Theme><Mode>.kt
//   dist/platforms/flutter/material_glass_<theme>_<mode>.dart
import StyleDictionary from 'style-dictionary';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dtcg = join(root, 'dist/tokens/dtcg');
const out = join(root, 'dist/platforms');
const pascal = (s) => s.split(/[-.]/).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
// Only colours and plain numbers: pixel dimensions and type need platform-specific handling.
const filter = (t) => t.$type === 'color' || t.$type === 'number';

const files = readdirSync(dtcg).filter((f) => f.startsWith('color.'));
for (const f of files) {
  const [, theme, mode] = f.split('.');
  const name = pascal(`${theme}-${mode}`);
  const sd = new StyleDictionary({
    source: [join(dtcg, f)],
    usesDtcg: true,
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: {
      ios: { transformGroup: 'ios-swift', buildPath: `${out}/ios/`, files: [{ destination: `MaterialGlass${name}.swift`, format: 'ios-swift/enum.swift', filter, options: { className: `MaterialGlass${name}`, import: ['UIKit'] } }] },
      android: { transformGroup: 'compose', buildPath: `${out}/android/`, files: [{ destination: `MaterialGlass${name}.kt`, format: 'compose/object', filter, options: { className: `MaterialGlass${name}`, packageName: 'dev.materialglass.tokens' } }] },
      flutter: { transformGroup: 'flutter', buildPath: `${out}/flutter/`, files: [{ destination: `material_glass_${theme.replace(/-/g, '_')}_${mode}.dart`, format: 'flutter/class.dart', filter, options: { className: `MaterialGlass${name}` } }] }
    }
  });
  await sd.buildAllPlatforms();
}
const sample = readFileSync(join(out, 'ios/MaterialGlassSeaGlassDark.swift'), 'utf8');
console.log(`dist/platforms: ${files.length} themes × iOS, Android, Flutter (${sample.split('\n').filter((l) => l.includes('public static let')).length} tokens each)`);
