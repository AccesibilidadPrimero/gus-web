// Fotogramas de GUS.
// Escritorio: los fotogramas cambian con las flechas anterior/siguiente, con fundido.
//   Nada se mueve solo, así que no hace falta botón de pausa.
// Móvil y tablet vertical: una sola pantalla. Tarjeta + fotogramas en una tira horizontal
//   que se recorre con el dedo (o con las flechas del teclado), en bucle. Sin botones.
(() => {
  const backdrop = document.querySelector(".backdrop");
  const scroller = document.querySelector(".layout");
  const prevBtn = document.querySelector(".slide-prev");
  const nextBtn = document.querySelector(".slide-next");
  if (!backdrop || !scroller || !prevBtn || !nextBtn) return;

  const slides = Array.from(backdrop.querySelectorAll("img.still"));
  if (slides.length < 2) return;

  /* ---------- Escritorio: flechas con fundido ---------- */
  let current = 0;
  const step = (dir) => {
    const next = (current + dir + slides.length) % slides.length;
    slides[current].classList.remove("is-active");
    slides[next].classList.add("is-active");
    current = next;
  };
  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  prevBtn.hidden = false;
  nextBtn.hidden = false;

  /* ---------- Móvil: tira con bucle ---------- */
  // Al final de la tira hay una copia de la tarjeta y del primer fotograma.
  // Al llegar a la copia se vuelve al inicio real: la vista es idéntica y no se nota el salto.
  const clone = document.querySelector(".card.loop-clone");
  const card = document.getElementById("main");
  const root = document.documentElement;
  // Logo pequeño arriba a la izquierda cuando la tarjeta (o su copia del bucle) no está a la vista
  const updateMiniBrand = () => {
    const x = scroller.scrollLeft;
    const vw = scroller.clientWidth;
    const cardInView = x < card.offsetWidth * 0.5;
    const cloneInView = clone && x + vw > clone.offsetLeft + vw * 0.5;
    root.classList.toggle("card-hidden", !cardInView && !cloneInView);
  };
  const onScroll = () => {
    const at = clone ? clone.offsetLeft : 0;
    if (at > 0 && scroller.scrollLeft >= at) scroller.scrollLeft -= at;
    updateMiniBrand();
  };

  const mobile = window.matchMedia("(max-width: 59.99rem)");
  const applyMode = () => {
    if (mobile.matches) {
      scroller.setAttribute("tabindex", "0"); // la tira también se recorre con las flechas del teclado
      scroller.addEventListener("scroll", onScroll, { passive: true });
      updateMiniBrand();
    } else {
      scroller.removeAttribute("tabindex");
      scroller.removeEventListener("scroll", onScroll);
      scroller.scrollLeft = 0;
      root.classList.toggle("card-hidden", card.classList.contains("is-hidden")); // en escritorio manda el botón de ojo
    }
  };
  applyMode();
  mobile.addEventListener?.("change", applyMode);
})();
