// Stamps shared partials into the demo pages between marker comments:
//   <!-- @topbar -->…<!-- /@topbar -->   and   <!-- @sprite -->…<!-- /@sprite -->
// {{base}} in a partial becomes the relative path back to the site root.
// Also marks the current page's link in the top nav.
// Usage: node scripts/pages.mjs   (run by npm run build)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const partial = (name) => readFileSync(join(root, 'demo/partials', name + '.html'), 'utf8').trim();

const pages = ['index.html', 'components.html', 'builder.html'].filter((p) => existsSync(join(root, p)));
const ex = join(root, 'examples');
if (existsSync(ex)) {
  pages.push('examples/index.html');
  for (const d of readdirSync(ex, { withFileTypes: true })) if (d.isDirectory() && existsSync(join(ex, d.name, 'index.html'))) pages.push(`examples/${d.name}/index.html`);
}

let changed = 0;
for (const page of pages) {
  const file = join(root, page);
  if (!existsSync(file)) continue;
  const depth = page.split('/').length - 1;
  const base = depth ? '../'.repeat(depth) : '';
  const current = page === 'index.html' ? 'home' : page.startsWith('examples') ? 'examples' : page.replace('.html', '');
  let html = readFileSync(file, 'utf8');
  const before = html;
  for (const name of ['topbar', 'sprite', 'examplebar']) {
    const re = new RegExp(`<!-- @${name} -->[\\s\\S]*?<!-- /@${name} -->`);
    if (!re.test(html)) continue;
    let body = partial(name).replaceAll('{{base}}', base);
    if (name === 'topbar') body = body.replace(`data-page="${current}"`, `data-page="${current}" aria-current="page"`);
    html = html.replace(re, `<!-- @${name} -->\n${body}\n<!-- /@${name} -->`);
  }
  if (html !== before) { writeFileSync(file, html); changed++; }
}
console.log(`pages: ${pages.length} demo pages, ${changed} updated`);
