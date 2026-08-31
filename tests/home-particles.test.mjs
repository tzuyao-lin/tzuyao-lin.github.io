import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const script = await readFile(new URL("../home.js", import.meta.url), "utf8");

function createPage({ darkMode = false, reducedMotion = false } = {}) {
  const frames = [];
  const listeners = new Map();
  const arcs = [];
  const fillStyles = [];

  const context2d = {
    clearRect() {},
    setTransform() {},
    beginPath() {},
    arc(x, y, radius) {
      arcs.push({ x, y, radius });
    },
    fill() {},
    save() {},
    restore() {},
    set fillStyle(value) {
      fillStyles.push(value);
    },
    set globalAlpha(_) {},
    set shadowBlur(_) {},
    set shadowColor(_) {},
  };

  const canvas = {
    clientWidth: 1200,
    clientHeight: 700,
    width: 0,
    height: 0,
    getContext: () => context2d,
  };

  const hero = {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 700 }),
  };

  const document = {
    body: {
      classList: {
        contains(className) {
          return className === "quarto-dark" && darkMode;
        },
      },
    },
    hidden: false,
    querySelector(selector) {
      if (selector === ".home-hero") return hero;
      if (selector === ".trajectory-particles") return canvas;
      return null;
    },
    addEventListener(type, listener) {
      listeners.set(`document:${type}`, listener);
    },
  };

  const window = {
    devicePixelRatio: 2,
    matchMedia(query) {
      return {
        matches: query.includes("prefers-reduced-motion") ? reducedMotion : true,
      };
    },
    requestAnimationFrame(callback) {
      frames.push(callback);
      return frames.length;
    },
    cancelAnimationFrame() {},
    addEventListener(type, listener) {
      listeners.set(`window:${type}`, listener);
    },
  };

  class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe() {
      this.callback();
    }
  }

  vm.runInNewContext(script, { document, window, ResizeObserver, Math });

  return { arcs, canvas, fillStyles, frames, listeners };
}

function renderedPalette(fillStyles) {
  const colors = fillStyles.map((style) => {
    const channels = style.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    assert.ok(channels?.length === 3, `expected an RGB color, got ${style}`);
    return channels;
  });

  return {
    hasAmber: colors.some(([red, green, blue]) => red > green && green > blue),
    hasTeal: colors.some(([red, green, blue]) => green > red && blue > red),
  };
}

test("data nodes keep drawing ambient motion without pointer input", () => {
  const page = createPage();

  assert.ok(page.frames.length > 0, "expected an ambient animation frame");
  page.frames.shift()(1000);
  assert.ok(page.arcs.length >= 12, "expected a restrained field of visible data nodes");

  const firstFrame = page.arcs.slice();
  page.arcs.length = 0;
  page.frames.shift()(9000);

  assert.equal(page.arcs.length, firstFrame.length);
  assert.ok(
    page.arcs.some((node, index) => node.x !== firstFrame[index].x || node.y !== firstFrame[index].y),
    "expected nodes to drift between ambient frames",
  );
});

test("reduced motion draws a static constellation without scheduling animation", () => {
  const page = createPage({ reducedMotion: true });

  assert.ok(page.arcs.length >= 12, "expected a static constellation");
  assert.equal(page.frames.length, 0, "reduced motion must not schedule animation frames");
});

test("constellation fills the dense trajectory field with about 34 nodes", () => {
  const page = createPage();
  page.frames.shift()(1000);

  assert.ok(page.arcs.length >= 32 && page.arcs.length <= 36, `expected about 34 nodes, got ${page.arcs.length}`);
});

test("light and dark themes both render teal and amber nodes", () => {
  for (const darkMode of [false, true]) {
    const page = createPage({ darkMode });
    page.frames.shift()(1000);
    const palette = renderedPalette(page.fillStyles);

    assert.equal(palette.hasTeal, true, `${darkMode ? "dark" : "light"} theme is missing teal nodes`);
    assert.equal(palette.hasAmber, true, `${darkMode ? "dark" : "light"} theme is missing amber nodes`);
  }
});
