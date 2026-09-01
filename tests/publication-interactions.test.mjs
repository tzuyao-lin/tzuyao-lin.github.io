import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

let script = "";
try {
  script = await readFile(new URL("../publication.js", import.meta.url), "utf8");
} catch {
  // The first TDD run intentionally exercises the page before the interaction script exists.
}

function createPage() {
  const listeners = new Map();
  const clipboardWrites = [];
  const timeouts = [];

  const abstractLabel = { textContent: "" };
  const details = {
    open: false,
    addEventListener(type, listener) {
      listeners.set(`details:${type}`, listener);
    },
    querySelector(selector) {
      return selector === ".publication-abstract-label" ? abstractLabel : null;
    },
  };

  const buttonLabel = { textContent: "BibTeX" };
  const buttonClasses = new Set();
  const button = {
    dataset: {
      citationFormat: "bibtex",
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
      if (selector === ".publication-abstract") return [details];
      if (selector === ".publication-citation-button") return [button];
      return [];
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
    abstractLabel,
    buttonClasses,
    buttonLabel,
    clipboardWrites,
    details,
    listeners,
    timeouts,
  };
}

test("abstract controls describe their open and closed state", () => {
  const page = createPage();
  assert.equal(page.abstractLabel.textContent, "Show abstract");

  page.details.open = true;
  page.listeners.get("details:toggle")();
  assert.equal(page.abstractLabel.textContent, "Hide abstract");
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
