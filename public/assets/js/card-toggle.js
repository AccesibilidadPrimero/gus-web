// Botón de ojo: oculta la tarjeta de texto para ver el fotograma completo, y la vuelve a mostrar.
// Solo actúa cuando la persona lo pide: el texto nunca desaparece por sí solo.
(() => {
  const button = document.querySelector(".card-toggle");
  const card = document.getElementById("main");
  if (!button || !card) return;

  const label = button.querySelector(".card-toggle-label");
  const iconEye = button.querySelector(".icon-eye");
  const iconText = button.querySelector(".icon-text");
  const { hide: textHide, show: textShow } = button.dataset;

  const setHidden = (hidden) => {
    card.classList.toggle("is-hidden", hidden);
    document.documentElement.classList.toggle("card-hidden", hidden); // muestra el logo pequeño
    label.textContent = hidden ? textShow : textHide;
    iconEye.toggleAttribute("hidden", hidden);
    iconText.toggleAttribute("hidden", !hidden);
  };

  button.hidden = false;
  button.addEventListener("click", () => setHidden(!card.classList.contains("is-hidden")));

  // Escape vuelve a mostrar el texto
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && card.classList.contains("is-hidden")) {
      setHidden(false);
      button.focus();
    }
  });
})();
