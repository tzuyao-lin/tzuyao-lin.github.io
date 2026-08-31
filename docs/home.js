(() => {
  const hero = document.querySelector(".home-hero");
  const finePointer = window.matchMedia("(pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!hero || !finePointer.matches || reducedMotion.matches) return;

  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  const paintGlow = () => {
    const bounds = hero.getBoundingClientRect();
    hero.style.setProperty("--glow-x", `${pointerX - bounds.left}px`);
    hero.style.setProperty("--glow-y", `${pointerY - bounds.top}px`);
    hero.dataset.pointerActive = "true";
    frame = 0;
  };

  hero.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(paintGlow);
  });

  hero.addEventListener("pointerleave", () => {
    hero.dataset.pointerActive = "false";
  });
})();
