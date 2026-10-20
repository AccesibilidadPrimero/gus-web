// Fotogramas de GUS.
// Escritorio: pase automático con fundido, flechas anterior/siguiente y pausa (WCAG 2.2.2).
//   Con "reducir movimiento" activo no arranca solo.
// Móvil y tablet vertical: tira horizontal que se recorre con el dedo o con las flechas,
//   en bucle en los dos sentidos. Sin pase automático.
(() => {
  const INTERVAL = 7000;
  const backdrop = document.querySelector(".backdrop");
  const scroller = document.querySelector(".layout");
  const pauseBtn = document.querySelector(".slideshow-control");
  const prevBtn = document.querySelector(".slide-prev");
  const nextBtn = document.querySelector(".slide-next");
  if (!backdrop || !scroller || !pauseBtn || !prevBtn || !nextBtn) return;

  const slides = Array.from(backdrop.querySelectorAll("img.still"));
  if (slides.length < 2) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 59.99rem)");

  /* ---------- Escritorio: fundidos ---------- */
  const label = pauseBtn.querySelector(".slideshow-label");
  const iconPause = pauseBtn.querySelector(".icon-pause");
  const iconPlay = pauseBtn.querySelector(".icon-play");
  const { pause: textPause, play: textPlay } = pauseBtn.dataset;
  let current = 0;
  let timer = null;

  const show = (next) => {
    slides[current].classList.remove("is-active");
    slides[next].classList.add("is-active");
    current = next;
  };
  const step = (dir) => show((current + dir + slides.length) % slides.length);

  const playing = () => timer !== null;
  const render = () => {
    const isPlaying = playing();
    label.textContent = isPlaying ? textPause : textPlay;
    iconPause.toggleAttribute("hidden", !isPlaying);
    iconPlay.toggleAttribute("hidden", isPlaying);
  };
  const play = () => {
    if (playing()) return;
    timer = setInterval(() => step(1), INTERVAL);
    render();
  };
  const stop = () => {
    clearInterval(timer);
    timer = null;
    render();
  };
  // Si el pase está en marcha, una flecha reinicia la cuenta para que la imagen elegida no cambie enseguida
  const restart = () => { if (playing()) { stop(); play(); } };

  pauseBtn.addEventListener("click", () => (playing() ? stop() : play()));

  /* ---------- Móvil: tira con bucle ---------- */
  // Al final de la tira hay una copia de la sinopsis y del primer fotograma.
  // Al llegar a la copia se vuelve al inicio real: la vista es idéntica y no se nota el salto.
  const clone = backdrop.querySelector(".card.loop-clone");
  const loopAt = () => (clone ? clone.offsetLeft : 0);
  const behavior = () => (reduceMotion.matches ? "auto" : "smooth");

  const onScroll = () => {
    const at = loopAt();
    if (at > 0 && scroller.scrollLeft >= at) scroller.scrollLeft -= at;
  };

  // Cada flecha avanza o retrocede una pantalla, así se recorre cada panorama entero
  const screen = () => scroller.clientWidth * 0.85;
  const stripNext = () => scroller.scrollBy({ left: screen(), behavior: behavior() });
  const stripPrev = () => {
    if (scroller.scrollLeft < 4) scroller.scrollLeft = loopAt() - 1; // misma vista, desde la copia
    scroller.scrollBy({ left: -screen(), behavior: behavior() });
  };

  /* ---------- Flechas ---------- */
  prevBtn.addEventListener("click", () => (mobile.matches ? stripPrev() : (step(-1), restart())));
  nextBtn.addEventListener("click", () => (mobile.matches ? stripNext() : (step(1), restart())));

  /* ---------- Cambio de modo ---------- */
  const applyMode = () => {
    prevBtn.hidden = false;
    nextBtn.hidden = false;
    if (mobile.matches) {
      stop();
      pauseBtn.hidden = true;
      scroller.setAttribute("tabindex", "0"); // la tira también se recorre con las flechas del teclado
      scroller.addEventListener("scroll", onScroll, { passive: true });
    } else {
      pauseBtn.hidden = false;
      scroller.removeAttribute("tabindex");
      scroller.removeEventListener("scroll", onScroll);
      scroller.scrollLeft = 0;
      if (!reduceMotion.matches) play(); else render();
    }
  };
  applyMode();
  mobile.addEventListener?.("change", applyMode);
  reduceMotion.addEventListener?.("change", (e) => e.matches && stop());
})();
