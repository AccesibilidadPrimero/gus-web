// Genera public/{ca,es,en}/index.html a partir de content/site.json.
// Uso: npm run build
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const site = JSON.parse(await readFile(new URL("content/site.json", root), "utf8"));
const codes = Object.keys(site.languages);

// Huella del contenido: si un CSS o JS cambia, cambia su URL y el navegador lo vuelve a descargar
const fingerprint = async (path) =>
  createHash("sha256").update(await readFile(new URL(`public${path}`, root))).digest("hex").slice(0, 10);
const asset = {};
for (const path of ["/assets/css/site.css", "/assets/js/slideshow.js", "/assets/js/card-toggle.js", ...site.backgrounds.map((b) => b.src)]) {
  asset[path] = `${path}?v=${await fingerprint(path)}`;
}

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
  // Fotogramas con texto alternativo. La primera se carga al momento; el resto, bajo demanda.
  const backgrounds = site.backgrounds
    .map(({ src, alt }, i) =>
      i === 0
        ? `    <img class="still is-active" src="${asset[src]}" alt="${esc(alt[code])}" width="2048" height="870" fetchpriority="high">`
        : `    <img class="still" src="${asset[src]}" alt="${esc(alt[code])}" width="2048" height="870" loading="lazy">`
    )
    .join("\n");

  const paragraphs = t.synopsis.map((p) => `          <p>${esc(p)}</p>`).join("\n");

  // Contenido de la tarjeta. La copia del bucle (real = false) va sin ids ni encabezados
  const cardInner = (real) => {
    const logo = `<img src="/assets/img/logo/${code}-stack-color.webp" alt="${real ? esc(t.title) : ""}" width="1000" height="${{ ca: 571, es: 572, en: 589 }[code]}">`;
    return real
      ? `      <h1 class="title">
        ${logo}
      </h1>
      <p class="release"><time datetime="2027">${esc(t.release)}</time></p>

      <section class="synopsis" aria-labelledby="synopsis-title">
        <h2 id="synopsis-title">${esc(t.synopsisHeading)}</h2>
${paragraphs}
      </section>
      <p class="swipe-hint" aria-hidden="true">${esc(t.swipeHint)} <span>→</span></p>`
      : `        <div class="title">${logo}</div>
        <p class="release">${esc(t.release)}</p>
        <div class="synopsis">
          <p class="h2-like">${esc(t.synopsisHeading)}</p>
${paragraphs}
        </div>
        <p class="swipe-hint">${esc(t.swipeHint)} <span>→</span></p>`;
  };

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
  <meta property="og:image" content="${url.slice(0, -1)}${site.backgrounds[0].src}">
  <meta property="og:locale" content="${{ ca: "ca_ES", es: "es_ES", en: "en_GB" }[code] || code}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.png" type="image/png">
  <link rel="preload" href="/assets/fonts/atkinson-hyperlegible-next-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/fredoka-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${asset["/assets/css/site.css"]}">
  <script src="${asset["/assets/js/slideshow.js"]}" defer></script>
  <script src="${asset["/assets/js/card-toggle.js"]}" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">${esc(t.skip)}</a>

  <!-- Solo en escritorio: aparece al ocultar la tarjeta (el título real sigue siendo el h1 de la tarjeta) -->
  <div class="mini-brand" aria-hidden="true">
    <img src="/assets/img/logo/${code}-h-color.webp" alt="" width="1000" height="${{ ca: 303, es: 304, en: 308 }[code]}">
    <span class="release">${esc(t.release)}</span>
  </div>

  <header class="site-header">
    <nav class="lang" aria-label="${esc(t.langNav)}">
      <ul>
${langLinks}
      </ul>
    </nav>
    <div class="controls">
      <button type="button" class="control-btn card-toggle" hidden aria-controls="main" data-hide="${esc(t.hideText)}" data-show="${esc(t.showText)}">
        <svg class="icon-eye" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3.5"/></svg>
        <svg class="icon-text" viewBox="0 0 24 24" aria-hidden="true" focusable="false" hidden><path d="M4 6h16M4 12h16M4 18h10"/></svg>
        <span class="card-toggle-label visually-hidden">${esc(t.hideText)}</span>
      </button>
      <button type="button" class="control-btn slide-prev" hidden>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg>
        <span class="visually-hidden">${esc(t.prev)}</span>
      </button>
      <button type="button" class="control-btn slide-next" hidden>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg>
        <span class="visually-hidden">${esc(t.next)}</span>
      </button>
    </div>
  </header>

  <div class="layout">
    <main id="main" class="card" tabindex="-1">
${cardInner(true)}
    </main>

    <section class="backdrop" aria-labelledby="stills-title" data-strip-label="${esc(t.stripLabel)}">
      <h2 id="stills-title" class="visually-hidden">${esc(t.stillsHeading)}</h2>
${backgrounds}
      <!-- Solo en móvil: copia de la tarjeta y del primer fotograma para cerrar el bucle sin saltos -->
      <div class="card loop-clone" aria-hidden="true" inert>
${cardInner(false)}
      </div>
      <img class="loop-clone" src="${site.backgrounds[0].src}" alt="" width="2048" height="870" loading="lazy" aria-hidden="true">
    </section>
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

// La página 404 usa la misma hoja de estilos: actualiza su huella
const notFound = new URL("public/404.html", root);
const html404 = await readFile(notFound, "utf8");
await writeFile(notFound, html404.replace(/\/assets\/css\/site\.css(\?v=[\w]+)?/, asset["/assets/css/site.css"]));
console.log("✓ public/404.html");
