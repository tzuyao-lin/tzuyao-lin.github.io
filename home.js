(() => {
  const hero = document.querySelector(".home-hero");
  const canvas = document.querySelector(".trajectory-particles");
  const finePointer = window.matchMedia("(pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!hero || !canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const nodes = [
    [0.08, 0.89],
    [0.14, 0.86],
    [0.21, 0.83],
    [0.28, 0.8],
    [0.35, 0.77],
    [0.42, 0.74],
    [0.49, 0.7],
    [0.56, 0.67],
    [0.64, 0.63],
    [0.72, 0.59],
    [0.81, 0.54],
    [0.9, 0.49],
    [0.97, 0.44],
    [0.24, 0.72],
    [0.31, 0.69],
    [0.38, 0.65],
    [0.45, 0.61],
    [0.52, 0.57],
    [0.6, 0.52],
    [0.68, 0.48],
    [0.76, 0.43],
    [0.84, 0.38],
    [0.92, 0.33],
    [0.98, 0.29],
    [0.43, 0.54],
    [0.5, 0.49],
    [0.57, 0.44],
    [0.64, 0.39],
    [0.71, 0.34],
    [0.79, 0.29],
    [0.86, 0.24],
    [0.93, 0.19],
    [0.98, 0.15],
    [0.74, 0.53],
  ].map(([x, y], index) => ({
    x,
    y,
    phase: (index * 1.37) % (Math.PI * 2),
    tone: index % 3 === 2 ? "amber" : "teal",
    radius: 1.95 + (index % 4) * 0.45 + (index % 13 === 0 ? 0.65 : 0),
    driftX: 2.5 + (index % 3) * 1.1,
    driftY: 2 + ((index + 1) % 3) * 0.9,
  }));

  const pointer = { active: false, x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let animationFrame = 0;

  const resize = () => {
    const bounds = hero.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (reducedMotion.matches) draw(0);
  };

  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    const seconds = time / 1000;
    const darkMode = Boolean(document.body?.classList?.contains("quarto-dark"));

    nodes.forEach((node) => {
      const driftX = reducedMotion.matches ? 0 : Math.sin(seconds * 0.55 + node.phase) * node.driftX;
      const driftY = reducedMotion.matches ? 0 : Math.cos(seconds * 0.42 + node.phase) * node.driftY;
      const x = node.x * width + driftX;
      const y = node.y * height + driftY;
      const pulse = reducedMotion.matches ? 0 : (Math.sin(seconds * 0.7 + node.phase) + 1) * 0.22;
      const distance = pointer.active ? Math.hypot(pointer.x - x, pointer.y - y) : Infinity;
      const proximity = Math.max(0, 1 - distance / 175) ** 2;
      const radius = node.radius + pulse + proximity * 2.2;
      const nodeColor = node.tone === "amber"
        ? {
            fill: darkMode ? "rgba(238, 173, 92, 0.98)" : "rgba(194, 118, 53, 0.94)",
            shadow: darkMode ? "rgba(244, 177, 91, 0.9)" : "rgba(221, 145, 70, 0.72)",
          }
        : {
            fill: darkMode ? "rgba(121, 194, 185, 0.95)" : "rgba(35, 133, 143, 0.92)",
            shadow: darkMode ? "rgba(98, 195, 205, 0.9)" : "rgba(41, 151, 165, 0.72)",
          };

      context.save();
      context.globalAlpha = 0.34 + pulse * 0.18 + proximity * 0.5;
      context.fillStyle = nodeColor.fill;
      context.shadowColor = nodeColor.shadow;
      context.shadowBlur = 4 + proximity * 15;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  };

  const animate = (time) => {
    draw(time);
    animationFrame = window.requestAnimationFrame(animate);
  };

  const updatePointer = (event) => {
    const bounds = hero.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
  };

  const stopPointer = () => {
    pointer.active = false;
  };

  const updateVisibility = () => {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    } else if (!reducedMotion.matches && !animationFrame) {
      animationFrame = window.requestAnimationFrame(animate);
    }
  };

  new ResizeObserver(resize).observe(hero);

  if (reducedMotion.matches) return;

  if (finePointer.matches) {
    hero.addEventListener("pointermove", updatePointer);
    hero.addEventListener("pointerleave", stopPointer);
  }

  document.addEventListener("visibilitychange", updateVisibility);
  animationFrame = window.requestAnimationFrame(animate);
})();
