import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

let script = "";
try {
  script = await readFile(
    new URL("../assets/js/publication.js", import.meta.url),
    "utf8",
  );
} catch {
  // The first TDD run intentionally exercises the page before the interaction script exists.
}

function createPage() {
  const listeners = new Map();
  const clipboardWrites = [];
  const timeouts = [];

  const abstractLabel = { textContent: "Show abstract" };
  const abstractPanel = { hidden: true };
  const abstractAttributes = new Map([
    ["aria-controls", "publication-abstract-example"],
    ["aria-expanded", "false"],
  ]);
  const abstractToggle = {
    addEventListener(type, listener) {
      listeners.set(`abstract:${type}`, listener);
    },
    querySelector(selector) {
      if (selector === ".publication-abstract-label") return abstractLabel;
      return null;
    },
    getAttribute(name) {
      return abstractAttributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      abstractAttributes.set(name, String(value));
    },
  };

  const buttonLabel = { textContent: "BibTeX" };
  const buttonClasses = new Set();
  const button = {
    dataset: {
      citation: "%20%20%40article%7Bexample%7D%20%20",
    },
    addEventListener(type, listener) {
      listeners.set(`button:${type}`, listener);
    },
    querySelector(selector) {
      return selector === "span" ? buttonLabel : null;
    },
    classList: {
      add(className) {
        buttonClasses.add(className);
      },
      remove(className) {
        buttonClasses.delete(className);
      },
    },
  };

  const document = {
    addEventListener(type, listener) {
      listeners.set(`document:${type}`, listener);
    },
    querySelectorAll(selector) {
      if (selector === ".publication-abstract-toggle") return [abstractToggle];
      if (selector === ".publication-citation-button") return [button];
      return [];
    },
    getElementById(id) {
      return id === "publication-abstract-example" ? abstractPanel : null;
    },
  };

  const navigator = {
    clipboard: {
      async writeText(value) {
        clipboardWrites.push(value);
      },
    },
  };

  const window = {
    setTimeout(callback) {
      timeouts.push(callback);
      return timeouts.length;
    },
  };

  vm.runInNewContext(script, { decodeURIComponent, document, navigator, window });

  const ready = listeners.get("document:DOMContentLoaded");
  assert.equal(typeof ready, "function", "publication interactions must initialize on DOMContentLoaded");
  ready();

  return {
    abstractAttributes,
    abstractLabel,
    abstractPanel,
    abstractToggle,
    buttonClasses,
    buttonLabel,
    clipboardWrites,
    listeners,
    timeouts,
  };
}

test("abstract controls describe their open and closed state", () => {
  const page = createPage();
  assert.equal(page.abstractLabel.textContent, "Show abstract");
  assert.equal(page.abstractAttributes.get("aria-expanded"), "false");
  assert.equal(page.abstractPanel.hidden, true);

  page.listeners.get("abstract:click")();
  assert.equal(page.abstractLabel.textContent, "Hide abstract");
  assert.equal(page.abstractAttributes.get("aria-expanded"), "true");
  assert.equal(page.abstractPanel.hidden, false);

  page.listeners.get("abstract:click")();
  assert.equal(page.abstractLabel.textContent, "Show abstract");
  assert.equal(page.abstractAttributes.get("aria-expanded"), "false");
  assert.equal(page.abstractPanel.hidden, true);
});

test("citation controls copy trimmed text and show temporary success feedback", async () => {
  const page = createPage();
  await page.listeners.get("button:click")();

  assert.deepEqual(page.clipboardWrites, ["@article{example}"]);
  assert.equal(page.buttonLabel.textContent, "Copied");
  assert.equal(page.buttonClasses.has("is-copied"), true);

  page.timeouts[0]();
  assert.equal(page.buttonLabel.textContent, "BibTeX");
  assert.equal(page.buttonClasses.has("is-copied"), false);
});
