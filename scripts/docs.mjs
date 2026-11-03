// Builds the docs site (guide/*.html) from docs/guide/*.md.
// Generated tables: <!-- @themes-table -->, <!-- @presets-table -->, <!-- @vars-table -->.
// The shared top bar and icon sprite are stamped in afterwards by scripts/pages.mjs.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'docs/guide');
const outDir = join(root, 'guide');
mkdirSync(outDir, { recursive: true });

const themes = JSON.parse(readFileSync(join(root, 'dist/themes.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'src/components/manifest.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const GENERATED = {
  'themes-table': () => {
    const rows = themes.themes.map((t) => `<tr><td><span class="d-swatch" style="background:linear-gradient(135deg,${t.light.primary} 50%,${t.dark.primary} 50%)"></span><code>${t.id}</code></td><td>${esc(t.description)}</td><td>${t.generated ? 'Generated' : 'Hand-tuned'}</td></tr>`).join('');
    return `<div class="d-table"><table><thead><tr><th>Theme</th><th>Character</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },
  'presets-table': () => {
    const rows = themes.glassPresets.map((p) => `<tr><td><code>${p.id}</code></td><td>${esc(p.description)}</td><td>${p.textSafe ? 'Yes' : 'Decorative only'}</td></tr>`).join('');
    return `<div class="d-table"><table><thead><tr><th>Preset</th><th>Look</th><th>Text-safe</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  },
  'vars-table': () => {
    const rows = Object.entries(manifest.components).flatMap(([name, c]) => Object.entries(c.vars).map(([v, d], i) => `<tr>${i === 0 ? `<td rowspan="${Object.keys(c.vars).length}"><b>${name}</b><br><code>${esc(c.selector)}</code></td>` : ''}<td><code>${esc(v)}</code></td><td>${esc(d)}</td></tr>`)).join('');
    return `<div class="d-table"><table><thead><tr><th>Component</th><th>Variable</th><th>Default</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
};

const pages = readdirSync(src).filter((f) => f.endsWith('.md')).sort().map((f) => {
  const raw = readFileSync(join(src, f), 'utf8');
  const m = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  const meta = Object.fromEntries((m ? m[1] : '').split('\n').map((l) => l.split(/:\s(.+)/)).filter((p) => p[1]).map(([k, v]) => [k.trim(), v.trim()]));
  return { file: f, slug: f.replace(/^\d+-/, '').replace(/\.md$/, ''), meta, body: m ? raw.slice(m[0].length) : raw };
});

const index = [];
for (const page of pages) {
  const toc = [];
  const marked = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = slugify(text);
        if (depth === 2) toc.push({ id, text: text.replace(/<[^>]+>/g, '') });
        if (depth === 1) return `<h1 class="d-title">${text}</h1>\n`;
        return `<h${depth} id="${id}"><a class="d-anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${text}</h${depth}>\n`;
      },
      table(token) {
        const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
        const body = token.rows.map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`).join('');
        return `<div class="d-table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>\n`;
      },
      code({ text, lang }) {
        return `<div class="d-code"><pre class="mg-glass-1" tabindex="0"><code class="language-${esc(lang || 'text')}">${esc(text)}</code></pre><button class="mg-icon-btn d-copy" type="button" aria-label="Copy code" data-copy-code><svg aria-hidden="true"><use href="#i-copy"/></svg></button></div>\n`;
      }
    }
  });
  let html = marked.parse(page.body);
  html = html.replace(/<!-- @([a-z-]+) -->/g, (all, key) => (GENERATED[key] ? GENERATED[key]() : all));
  page.html = html;
  page.toc = toc;
  // Search index: page title + every h2/h3 with a short excerpt.
  const text = page.body.replace(/```[\s\S]*?```/g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const sec of text.split(/\n(?=##+ )/)) {
    const h = /^(#+)\s+(.+)/.exec(sec.trim());
    if (!h) continue;
    const words = sec.replace(/^#+.+\n/, '').replace(/[`*|_[\]()#>-]/g, ' ').replace(/\s+/g, ' ').trim();
    index.push({ page: page.slug, title: page.meta.title, heading: h[2].replace(/`/g, ''), id: h[1].length === 1 ? '' : slugify(h[2].replace(/`/g, '')), text: words.slice(0, 220) });
  }
}

const nav = pages.map((p) => `<a class="mg-drawer__item" href="${p.slug}.html" data-slug="${p.slug}">${esc(p.meta.title)}</a>`).join('\n      ');
const searchJson = JSON.stringify(index).replace(/</g, '\\u003c');

for (const [i, page] of pages.entries()) {
  const prev = pages[i - 1], next = pages[i + 1];
  const toc = page.toc.length ? `<nav class="d-toc" aria-label="On this page"><b>On this page</b>${page.toc.map((t) => `<a href="#${t.id}">${esc(t.text)}</a>`).join('')}</nav>` : '';
  const html = `<!doctype html>
<html lang="en" data-mg-theme="sea-glass" data-mg-mode="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.meta.title)} · Material Glass docs</title>
<meta name="description" content="${esc(page.meta.description || '')}">
<meta name="theme-color" content="#070C0C">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../material-glass.css">
<link rel="stylesheet" href="../demo/demo.css">
<link rel="stylesheet" href="../demo/docs.css">
<script src="../demo/prefs.js"></script>
</head>
<body>
<a class="skip mg-btn" href="#main">Skip to content</a>

<!-- GENERATED by scripts/docs.mjs from docs/guide/${page.file}. Edit the Markdown, not this file. -->
<!-- @sprite -->
<!-- /@sprite -->

<!-- @topbar -->
<!-- /@topbar -->

<div class="docs wrap">
  <aside class="docs__side mg-glass-1">
    <label class="mg-search mg-glass-1 d-search"><svg aria-hidden="true"><use href="#i-search"/></svg><span class="mg-sr-only">Search the docs</span><input class="mg-field__input" type="search" placeholder="Search docs" id="doc-search" autocomplete="off"></label>
    <div class="d-results" id="doc-results" role="list" hidden></div>
    <nav class="d-nav" aria-label="Docs">
      ${nav}
      <a class="mg-drawer__item" href="../components.html">Component catalog</a>
      <a class="mg-drawer__item" href="../builder.html">Theme builder</a>
    </nav>
  </aside>
  <main id="main" class="docs__main">
    <article class="d-prose">
${page.html}
    </article>
    <nav class="d-pager" aria-label="Pages">
      ${prev ? `<a class="mg-card mg-glass-1 mg-card--interactive" href="${prev.slug}.html"><small>Previous</small><b>${esc(prev.meta.title)}</b></a>` : '<span></span>'}
      ${next ? `<a class="mg-card mg-glass-1 mg-card--interactive d-pager__next" href="${next.slug}.html"><small>Next</small><b>${esc(next.meta.title)}</b></a>` : '<span></span>'}
    </nav>
  </main>
  ${toc}
</div>

<footer>
  <div class="wrap">
    <span>Material Glass is an unofficial community project. It is not affiliated with or endorsed by Google or Apple.</span>
    <span>MIT License · <a href="https://github.com/sky-five/material-glass/edit/main/docs/guide/${page.file}">Edit this page</a></span>
  </div>
</footer>

<script>window.MG_DOCS_INDEX = ${searchJson}; window.MG_DOCS_PAGE = ${JSON.stringify(page.slug)};</script>
<script src="../demo/themes.js"></script>
<script src="../material-glass.js"></script>
<script src="../demo/controls.js"></script>
<script src="../demo/docs.js"></script>
</body>
</html>
`;
  writeFileSync(join(outDir, `${page.slug}.html`), html);
  if (i === 0) writeFileSync(join(outDir, 'index.html'), html.replace(`window.MG_DOCS_PAGE = ${JSON.stringify(page.slug)}`, `window.MG_DOCS_PAGE = ${JSON.stringify(page.slug)}`));
}
console.log(`guide/: ${pages.length} pages + index, ${index.length} search entries`);
