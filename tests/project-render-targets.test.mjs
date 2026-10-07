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

test("website render excludes the CV subproject and keeps site pages", () => {
  const targets = renderTargets(repoRoot);

  for (const page of ["index.qmd", "about.qmd", "blog.qmd", "publication.qmd"]) {
    assert.ok(targets.includes(page), `missing website page: ${page}`);
  }
  assert.ok(targets.some((target) => target.startsWith(`posts${path.sep}`)));
  assert.ok(
    targets.every((target) => !target.startsWith(`cv${path.sep}`)),
    `website render includes CV files: ${targets.filter((target) => target.startsWith(`cv${path.sep}`)).join(", ")}`,
  );
});

test("CV subproject still renders its academic CV", () => {
  assert.deepEqual(renderTargets(path.join(repoRoot, "cv")), ["academic-cv.qmd"]);
});
