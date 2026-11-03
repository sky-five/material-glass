// Parses every generated stylesheet with Lightning CSS and fails on any warning or error,
// except pseudo-elements that are newer than the parser (listed below and re-checked on upgrade).
import { transform } from 'lightningcss';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const KNOWN_NEW = /'(picker|picker-icon|checkmark|details-content)' is not recognized/;
const files = ['material-glass.css', 'material-glass.min.css', 'dist/material-glass.core.css', 'dist/material-glass.unlayered.css',
  ...readdirSync(join(root, 'dist/components')).map((f) => `dist/components/${f}`)];

let problems = 0;
for (const file of files) {
  const code = readFileSync(join(root, file));
  try {
    const { warnings } = transform({ filename: file, code, errorRecovery: true });
    for (const w of warnings) {
      if (KNOWN_NEW.test(w.message)) continue;
      problems++;
      console.log(`✗ ${file}:${w.loc?.line}: ${w.message}`);
    }
  } catch (e) {
    problems++;
    console.log(`✗ ${file}: ${e.message} (line ${e.loc?.line})`);
  }
}
console.log(`${files.length} stylesheets parsed, ${problems} problems`);
process.exit(problems ? 1 : 0);
