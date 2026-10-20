# GUS, el perro guía · Web provisional

Página de presentación en tres idiomas (CA · ES · EN) con fundido de fotogramas, sinopsis y "2027 en cines". Desplegada en Cloudflare Workers desde GitHub.

## Estructura

```
content/site.json     Textos de los 3 idiomas y lista de imágenes de fondo
scripts/build.mjs     Genera public/{ca,es,en}/index.html desde site.json
public/               Lo que se publica (HTML, CSS, JS, fuentes, imágenes)
  _headers            Cabeceras de seguridad y caché
  404.html            Página de error trilingüe
src/worker.js         Sirve cada idioma en su dominio (en workers.dev y local, por rutas)
wrangler.jsonc        Configuración del Worker
```

## Cambiar textos o imágenes

1. Edita `content/site.json` (textos) o añade imágenes en `public/assets/img/bg/` y su entrada en `backgrounds` (`src` y `alt` en los tres idiomas).
2. Ejecuta `npm run build` para regenerar las tres páginas.
3. Haz commit y push: Cloudflare despliega solo.

Imágenes de fondo: WebP, 2048 px de ancho o más, menos de 150 KB cada una si es posible.

## Desarrollo local

```
npm install
npm run dev        # http://localhost:8787
```

## Dominios

| Idioma | Dominio |
| ------ | ------- |
| Català | guselgospigall.com |
| Español (por defecto) | guselperroguia.com |
| English | gustheguidedog.com |

Se definen en `content/site.json` (`domain`). El Worker y las páginas los leen de ahí.

- En cada dominio, `/` muestra su idioma.
- `/ca/`, `/es/` o `/en/` en un dominio redirigen (301) al dominio de ese idioma.
- `www.` redirige al dominio sin www.
- En `gus-web.<cuenta>.workers.dev` y en local se navega por rutas (`/ca/`, `/es/`, `/en/`) para probar.

## Despliegue con GitHub + Workers

1. Sube el proyecto al repositorio.
2. Cloudflare › Workers & Pages › Create application › Import a repository.
3. Project name `gus-web` · Build command `npm run build` · Deploy command `npx wrangler deploy`.
4. Los tres dominios deben estar como zonas en la misma cuenta de Cloudflare (nameservers apuntando a Cloudflare).
5. En el Worker › Settings › Domains & Routes › Add › Custom domain, añade los seis: cada dominio y su `www.`.

## Accesibilidad

- Texto siempre sobre fondo sólido Blau nit (13,5:1). Nada de texto sobre la imagen.
- Escritorio: los fotogramas cambian solo con las flechas anterior/siguiente (fundido); nada se mueve solo. Con "reducir movimiento" el cambio es instantáneo.
- Cada fotograma tiene texto alternativo en su idioma y se lee después de la sinopsis, como sección "Fotogramas de la película". El logotipo es el `h1` con el título como texto alternativo.
- El botón de ojo oculta la tarjeta para ver la imagen completa (Escape la vuelve a mostrar). El texto nunca se oculta solo.
- Cada idioma es una página real con su `lang`, enlaces de idioma con `lang` y `hreflang`, y enlace "Saltar al contenido".
- Fuentes autoalojadas (Fredoka 600 y Atkinson Hyperlegible Next 400/700): sin llamadas a Google Fonts.
- Móvil: una sola pantalla. Tarjeta y fotogramas en una tira horizontal que se recorre con el dedo (o con las flechas); al final vuelve al inicio en bucle. Sin pase automático. Si el texto se amplía mucho, la tarjeta se desplaza en vertical.
- Funciona sin JavaScript: se ve la primera imagen y todo el contenido.
