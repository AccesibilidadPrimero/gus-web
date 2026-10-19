// Worker de GUS, el perro guía.
//
// Cada idioma vive en su dominio (definidos en content/site.json):
//   guselgospigall.com  → català
//   guselperroguia.com  → español
//   gustheguidedog.com  → English
//
// En esos dominios, "/" sirve la página de su idioma y las rutas /ca/, /es/, /en/
// redirigen al dominio que corresponde (así no hay contenido duplicado).
// "www." redirige siempre al dominio sin www.
//
// En cualquier otro host (gus-web.xxx.workers.dev, localhost) se trabaja por rutas
// (/ca/, /es/, /en/) para poder probar antes de conectar los dominios, y los enlaces
// del selector de idioma se reescriben a esas rutas.

import site from "../content/site.json";

const LANGS = Object.keys(site.languages);
const DOMAIN_TO_LANG = Object.fromEntries(LANGS.map((l) => [site.languages[l].domain, l]));
const home = (lang) => `https://${site.languages[lang].domain}/`;

function pickLanguage(header) {
  if (!header) return site.defaultLanguage;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { base: tag.split("-")[0], q: q ? parseFloat(q.split("=")[1]) || 0 : 1 };
    })
    .filter((l) => l.q > 0)
    .sort((a, b) => b.q - a.q);
  return ranked.find((l) => LANGS.includes(l.base))?.base ?? site.defaultLanguage;
}

const redirect = (location, status = 301, extra = {}) =>
  new Response(null, { status, headers: { Location: location, ...extra } });

// Idioma al que apunta una ruta tipo /ca/ o /ca/index.html
function langFromPath(pathname) {
  const m = pathname.match(/^\/(ca|es|en)(\/|\/index\.html)?$/);
  return m ? m[1] : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    // www.dominio → dominio
    if (host.startsWith("www.") && DOMAIN_TO_LANG[host.slice(4)]) {
      url.hostname = host.slice(4);
      url.protocol = "https:";
      return redirect(url.toString());
    }

    const domainLang = DOMAIN_TO_LANG[host];
    const pathLang = langFromPath(url.pathname);

    // ---------- Producción: dominio por idioma ----------
    if (domainLang) {
      if (url.pathname === "/" || url.pathname === "/index.html") {
        const page = new URL(`/${domainLang}/`, url);
        return env.ASSETS.fetch(new Request(page, request));
      }
      if (pathLang) return redirect(home(pathLang));
      return env.ASSETS.fetch(request);
    }

    // ---------- Pruebas (workers.dev, localhost): idioma por ruta ----------
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const lang = pickLanguage(request.headers.get("Accept-Language"));
      return redirect(`/${lang}/`, 302, { Vary: "Accept-Language", "Cache-Control": "no-store" });
    }

    const response = await env.ASSETS.fetch(request);
    if (!pathLang) return response;

    // Los enlaces a los dominios definitivos se convierten en rutas locales
    let rewriter = new HTMLRewriter();
    for (const lang of LANGS) {
      rewriter = rewriter.on(`a[href="${home(lang)}"]`, {
        element: (el) => el.setAttribute("href", `/${lang}/`),
      });
    }
    return rewriter.transform(response);
  },
};
