(() => {
  const hero = document.querySelector(".home-hero");
  const canvas = document.querySelector(".trajectory-particles");
  const finePointer = window.matchMedia("(pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!hero || !canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const TAU = Math.PI * 2;
  const smoothstep = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // Seeded so the scene is identical on every load
  const mulberry32 = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const random = mulberry32(20241);

  // The scene lives in unit coordinates (x: 0..1 across, y: 0..1 down).
  // Individual trajectories fan out from a tight bundle on the left to a wide spread on the right.
  const centre = (x) => 0.9 - 0.52 * x ** 1.5;
  const spread = (x) => 0.03 + 0.36 * x;

  const trajectoryCount = 11;
  const trajectories = Array.from({ length: trajectoryCount }, (_, k) => ({
    offset: -1 + (2 * (k + 0.5)) / trajectoryCount + (random() - 0.5) * 0.12,
    amplitude: 0.03 + random() * 0.05,
    frequency: 0.9 + random() * 1.5,
    phase: random(),
    // the curve keeps undulating: two travelling waves and a slow sway of its offset
    amplitude2: 0.015 + random() * 0.03,
    frequency2: 2 + random() * 2,
    phase2: random(),
    drift: (0.008 + random() * 0.012) * (random() < 0.5 ? -1 : 1),
    drift2: (0.012 + random() * 0.014) * (random() < 0.5 ? -1 : 1),
    swayRate: 1 / (35 + random() * 35),
    swayPhase: random(),
    speed: 0.0033 + random() * 0.0022, // unit widths per second: three to five minutes to cross
    tone: k === 4 || k === 8 ? "amber" : "teal",
    emphasis: k === 1 || k === 6 ? 1 : 0,
  }));

  const trajectoryY = (trajectory, x, seconds) =>
    centre(x) +
    (trajectory.offset + 0.1 * Math.sin(TAU * (trajectory.swayRate * seconds + trajectory.swayPhase))) * spread(x) +
    trajectory.amplitude * Math.sin(TAU * (trajectory.frequency * x + trajectory.phase + trajectory.drift * seconds)) * (0.2 + x) +
    trajectory.amplitude2 * Math.sin(TAU * (trajectory.frequency2 * x + trajectory.phase2 + trajectory.drift2 * seconds)) * x;

  // Measurement occasions: fixed vertical lines the nodes drift across
  const columns = [];
  for (let x = 0.05 + random() * 0.03; x < 0.99; x += 0.05 + random() * 0.03) columns.push(x);

  const nodes = [];
  trajectories.forEach((trajectory) => {
    const count = 15;
    for (let i = 0; i < count; i += 1) {
      // Many tiny nodes, a few large ones
      const size = random() ** 3;
      nodes.push({
        trajectory,
        phase: (i + random() * 0.8) / count,
        scatter: random() < 0.5 ? 0 : (random() - 0.5) * 1.1,
        radius: 0.9 + size * 4.6,
        tone: random() < 0.22 ? "amber" : trajectory.tone,
        weight: 0.85 + size * 0.5,
        twinkleRate: TAU / (2.6 + random() * 5),
        twinklePhase: random() * TAU,
        level: 0,
        x: 0,
        y: 0,
      });
    }
  });

  const pointer = { active: false, x: 0, y: 0, smoothX: 0, smoothY: 0, strength: 0 };
  let width = 0;
  let height = 0;
  let animationFrame = 0;
  let lastSeconds = 0;

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (reducedMotion.matches) draw(0);
  };

  const palette = (dark) => ({
    teal: dark ? "121, 194, 185" : "35, 133, 143",
    amber: dark ? "238, 173, 92" : "194, 118, 53",
  });

  const edgeFade = (x) => smoothstep(0, 0.38, x) * (1 - smoothstep(0.88, 1, x));

  const draw = (time) => {
    const seconds = time / 1000;
    const delta = Math.min(0.05, Math.max(0.001, seconds - lastSeconds));
    lastSeconds = seconds;
    const motion = reducedMotion.matches ? 0 : seconds;
    const colors = palette(Boolean(document.body?.classList?.contains("quarto-dark")));
    const hoverRadius = Math.max(width, height) * 0.075;

    // Light follows the pointer with a little lag
    const follow = 1 - Math.exp(-delta / 0.08);
    if (pointer.active && pointer.strength === 0) {
      pointer.smoothX = pointer.x;
      pointer.smoothY = pointer.y;
    }
    pointer.smoothX += (pointer.x - pointer.smoothX) * follow;
    pointer.smoothY += (pointer.y - pointer.smoothY) * follow;
    pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * (1 - Math.exp(-delta / 0.25));
    if (pointer.strength < 0.002) pointer.strength = 0;

    const glow = (px, py) => {
      if (!pointer.strength) return 0;
      const distance = Math.hypot(px - pointer.smoothX, py - pointer.smoothY);
      return Math.exp(-((distance / hoverRadius) ** 2)) * pointer.strength;
    };

    context.clearRect(0, 0, width, height);

    // Measurement columns
    context.save();
    context.lineWidth = 1;
    context.setLineDash([2, 7]);
    columns.forEach((x) => {
      const px = x * width;
      const half = spread(x) * 1.08;
      context.strokeStyle = `rgba(${colors.teal}, ${0.26 * edgeFade(x)})`;
      context.beginPath();
      context.moveTo(px, (centre(x) - half) * height);
      context.lineTo(px, (centre(x) + half) * height);
      context.stroke();
    });
    context.restore();

    // Trajectories
    const steps = 140;
    trajectories.forEach((trajectory) => {
      const rgb = colors[trajectory.tone];
      const gradient = context.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `rgba(${rgb}, 0)`);
      gradient.addColorStop(0.4, `rgba(${rgb}, 1)`);
      gradient.addColorStop(0.86, `rgba(${rgb}, 1)`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);

      const points = [];
      for (let i = 0; i <= steps; i += 1) {
        const x = i / steps;
        points.push([x * width, trajectoryY(trajectory, x, motion) * height]);
      }

      context.save();
      context.strokeStyle = gradient;
      context.globalAlpha = trajectory.emphasis ? 0.34 : trajectory.tone === "amber" ? 0.2 : 0.15;
      context.lineWidth = trajectory.emphasis ? 1.5 : 1;
      context.beginPath();
      points.forEach(([px, py], i) => (i ? context.lineTo(px, py) : context.moveTo(px, py)));
      context.stroke();
      context.restore();

      // The stretch of the line under the pointer brightens
      if (pointer.strength) {
        context.save();
        context.lineWidth = 1.5;
        context.lineCap = "round";
        for (let i = 1; i < points.length; i += 1) {
          const level = glow((points[i][0] + points[i - 1][0]) / 2, (points[i][1] + points[i - 1][1]) / 2);
          if (level < 0.04) continue;
          context.strokeStyle = `rgba(${rgb}, ${level * 0.6 * edgeFade(i / steps)})`;
          context.beginPath();
          context.moveTo(points[i - 1][0], points[i - 1][1]);
          context.lineTo(points[i][0], points[i][1]);
          context.stroke();
        }
        context.restore();
      }
    });

    // Nodes drift left to right along their trajectories
    nodes.forEach((node) => {
      const drift = reducedMotion.matches ? 0 : seconds * node.trajectory.speed;
      const x = (node.phase + drift) % 1;
      const y = trajectoryY(node.trajectory, x, motion) + node.scatter * spread(x);
      node.x = x * width;
      node.y = y * height;

      const target = glow(node.x, node.y);
      const rising = target > node.level;
      node.level += (target - node.level) * (1 - Math.exp(-delta / (rising ? 0.1 : 0.45)));
      if (node.level < 0.002) node.level = 0;

      const breath = reducedMotion.matches ? 0.5 : 0.5 + 0.5 * Math.sin(seconds * (TAU / 6) - x * 6.5);
      let nearest = 1;
      for (const column of columns) nearest = Math.min(nearest, Math.abs(x - column));
      const pulse = Math.exp(-((nearest / 0.011) ** 2)); // a node is "measured" as it crosses a column

      // Each node twinkles on its own rhythm, mostly dim with occasional bright flashes
      const twinkle = reducedMotion.matches ? 0 : (0.5 + 0.5 * Math.sin(seconds * node.twinkleRate + node.twinklePhase)) ** 4;

      const alpha = Math.min(
        0.95,
        edgeFade(x) * node.weight * (0.2 + 0.36 * breath + 0.3 * pulse + 0.5 * twinkle) + node.level * 0.5,
      );
      if (alpha < 0.01) return;
      const radius = node.radius * (1 + 0.2 * breath + 0.28 * pulse + 0.3 * twinkle + 0.28 * node.level);
      const rgb = colors[node.tone];

      const halo = Math.max(node.level * 0.7, pulse * 0.45 * edgeFade(x), twinkle * 0.8 * edgeFade(x));
      if (halo > 0.04) {
        const haloRadius = radius * 4.2;
        const haze = context.createRadialGradient(node.x, node.y, 0, node.x, node.y, haloRadius);
        haze.addColorStop(0, `rgba(${rgb}, ${halo * 0.3})`);
        haze.addColorStop(1, `rgba(${rgb}, 0)`);
        context.fillStyle = haze;
        context.beginPath();
        context.arc(node.x, node.y, haloRadius, 0, TAU);
        context.fill();
      }

      context.fillStyle = `rgba(${rgb}, ${alpha})`;
      context.beginPath();
      context.arc(node.x, node.y, radius, 0, TAU);
      context.fill();
    });
  };

  const animate = (time) => {
    draw(time);
    animationFrame = window.requestAnimationFrame(animate);
  };

  const updatePointer = (event) => {
    const bounds = canvas.getBoundingClientRect();
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

  new ResizeObserver(resize).observe(canvas);
  resize();

  if (reducedMotion.matches) return;

  if (finePointer.matches) {
    hero.addEventListener("pointermove", updatePointer);
    hero.addEventListener("pointerleave", stopPointer);
  }

  document.addEventListener("visibilitychange", updateVisibility);
  animationFrame = window.requestAnimationFrame(animate);
})();
