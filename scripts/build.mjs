// Genera public/{ca,es,en}/index.html a partir de content/site.json.
// Uso: npm run build
import { readFile, writeFile, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const site = JSON.parse(await readFile(new URL("content/site.json", root), "utf8"));
const codes = Object.keys(site.languages);

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const page = (code) => {
  const t = site.languages[code];
  const home = (c) => `https://${site.languages[c].domain}/`;
  const url = home(code);

  // Cada idioma vive en su propio dominio
  const alternates = codes
    .map((c) => `  <link rel="alternate" hreflang="${c}" href="${home(c)}">`)
    .join("\n") + `\n  <link rel="alternate" hreflang="x-default" href="${home(site.defaultLanguage)}">`;

  const langLinks = codes
    .map((c) => {
      const l = site.languages[c];
      const current = c === code ? ' aria-current="page"' : "";
      return `          <li><a href="${home(c)}" lang="${l.htmlLang}" hreflang="${l.htmlLang}"${current}>${c.toUpperCase()}<span class="visually-hidden"> · ${esc(l.name)}</span></a></li>`;
    })
    .join("\n");

  // La primera imagen se carga al momento; el resto, bajo demanda desde el JS.
  const backgrounds = site.backgrounds
    .map((src, i) =>
      i === 0
        ? `    <img src="${src}" alt="" width="1920" height="816" fetchpriority="high" class="is-active">`
        : `    <img data-src="${src}" alt="" width="1920" height="816">`
    )
    .join("\n");

  const paragraphs = t.synopsis.map((p) => `          <p>${esc(p)}</p>`).join("\n");

  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(t.title)} · ${esc(t.release)}</title>
  <meta name="description" content="${esc(t.description)}">
  <meta name="theme-color" content="#172B46">
  <link rel="canonical" href="${url}">
${alternates}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(t.title)}">
  <meta property="og:description" content="${esc(t.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${url.slice(0, -1)}${site.backgrounds[0]}">
  <meta property="og:locale" content="${{ ca: "ca_ES", es: "es_ES", en: "en_GB" }[code] || code}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.png" type="image/png">
  <link rel="preload" href="/assets/fonts/atkinson-hyperlegible-next-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/fredoka-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/site.css">
  <script src="/assets/js/slideshow.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">${esc(t.skip)}</a>

  <div class="backdrop" aria-hidden="true">
${backgrounds}
  </div>

  <header class="site-header">
    <nav class="lang" aria-label="${esc(t.langNav)}">
      <ul>
${langLinks}
      </ul>
    </nav>
    <button type="button" class="slideshow-control" hidden data-pause="${esc(t.pause)}" data-play="${esc(t.play)}">
      <svg class="icon-pause" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>
      <svg class="icon-play" viewBox="0 0 16 16" aria-hidden="true" focusable="false" hidden><path d="M4 2.5v11a1 1 0 0 0 1.5.86l9-5.5a1 1 0 0 0 0-1.72l-9-5.5A1 1 0 0 0 4 2.5z"/></svg>
      <span class="slideshow-label visually-hidden">${esc(t.pause)}</span>
    </button>
  </header>

  <div class="layout">
    <main id="main" class="card" tabindex="-1">
      <h1 class="title">
        <img src="/assets/img/logo/${code}-stack-color.webp" alt="${esc(t.title)}" width="1000" height="${{ ca: 571, es: 572, en: 589 }[code]}">
      </h1>
      <p class="release"><time datetime="2027">${esc(t.release)}</time></p>

      <section class="synopsis" aria-labelledby="synopsis-title">
        <h2 id="synopsis-title">${esc(t.synopsisHeading)}</h2>
${paragraphs}
      </section>
    </main>
  </div>

</body>
</html>
`;
};

for (const code of codes) {
  const dir = new URL(`public/${code}/`, root);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL("index.html", dir), page(code));
  console.log(`✓ public/${code}/index.html`);
}
