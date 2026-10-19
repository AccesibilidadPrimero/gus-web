// Escritorio: pase de imágenes de fondo con fundido.
// - Se puede pausar (WCAG 2.2.2 Pausar, detener, ocultar).
// - Con "reducir movimiento" activo no arranca solo.
// Móvil y tablet vertical: carrusel horizontal que la persona recorre con el dedo.
// Ahí no hay pase automático ni botón de pausa.
(() => {
  const INTERVAL = 7000;
  const backdrop = document.querySelector(".backdrop");
  const button = document.querySelector(".slideshow-control");
  if (!backdrop || !button) return;

  const slides = Array.from(backdrop.querySelectorAll("img.still"));
  if (slides.length < 2) return; // con una sola imagen no hay pase ni botón

  const label = button.querySelector(".slideshow-label");
  const iconPause = button.querySelector(".icon-pause");
  const iconPlay = button.querySelector(".icon-play");
  const { pause: textPause, play: textPlay } = button.dataset;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let timer = null;

  const load = (img) => {
    if (img.dataset.src && !img.src) img.src = img.dataset.src;
  };

  const show = (next) => {
    const img = slides[next];
    load(img);
    const swap = () => {
      slides[current].classList.remove("is-active");
      img.classList.add("is-active");
      current = next;
      load(slides[(next + 1) % slides.length]); // precarga la siguiente
    };
    img.complete && img.naturalWidth ? swap() : img.addEventListener("load", swap, { once: true });
  };

  const playing = () => timer !== null;

  const render = () => {
    const isPlaying = playing();
    label.textContent = isPlaying ? textPause : textPlay;
    iconPause.toggleAttribute("hidden", !isPlaying);
    iconPlay.toggleAttribute("hidden", isPlaying);
  };

  const play = () => {
    if (playing()) return;
    timer = setInterval(() => show((current + 1) % slides.length), INTERVAL);
    render();
  };

  const stop = () => {
    clearInterval(timer);
    timer = null;
    render();
  };

  button.addEventListener("click", () => (playing() ? stop() : play()));

  // Cambio entre modo escritorio (pase) y modo móvil (carrusel)
  const mobile = window.matchMedia("(max-width: 59.99rem)");
  const applyMode = () => {
    if (mobile.matches) {
      stop();
      button.hidden = true;
      // El carrusel se puede recorrer también con teclado (flechas)
      backdrop.setAttribute("tabindex", "0");
      backdrop.setAttribute("aria-label", backdrop.dataset.stripLabel);
      backdrop.removeAttribute("aria-labelledby");
    } else {
      button.hidden = false;
      backdrop.removeAttribute("tabindex");
      backdrop.removeAttribute("aria-label");
      backdrop.setAttribute("aria-labelledby", "stills-title");
      if (!reduceMotion.matches) play(); else render();
    }
  };
  applyMode();
  mobile.addEventListener?.("change", applyMode);

  reduceMotion.addEventListener?.("change", (e) => e.matches && stop());
})();
