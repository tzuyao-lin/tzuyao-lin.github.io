import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function renderTargets(projectDir) {
  const project = JSON.parse(
    execFileSync("quarto", ["inspect", projectDir], { encoding: "utf8" }),
  );
  return project.files.input.map((file) => path.relative(projectDir, file));
}

test("website render includes the site pages but nothing under cv/", () => {
  const targets = renderTargets(repoRoot);

  for (const page of [
    "index.qmd",
    "about.qmd",
    "blog.qmd",
    "publication.qmd",
    "contact.qmd",
  ]) {
    assert.ok(targets.includes(page), `missing website page: ${page}`);
  }
  assert.ok(targets.some((target) => target.startsWith(`posts${path.sep}`)));
  // The CV is rendered separately: `quarto render cv/academic-cv.qmd`.
  assert.ok(!targets.some((target) => target.startsWith(`cv${path.sep}`)));
});
