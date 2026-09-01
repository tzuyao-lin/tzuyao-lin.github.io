# Quarto Project Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the Quarto blog into a predictable, maintainable source structure without changing its four main routes or any post route.

**Architecture:** Keep Quarto configuration and route-owning QMD files at the root, move page-specific browser assets under `assets/`, keep publication data and rendering inputs in plain responsibility-based directories, and keep internal Markdown under `_project/` so Quarto excludes it. Post-specific privacy guidance is merged into the relevant post, while `docs/` remains a separately reviewed generated artifact.

**Tech Stack:** Quarto 1.10.18, Markdown/QMD, YAML, EJS, CSS, browser JavaScript, Node test runner, Bash, R with `renv` and Quarto freeze.

**Spec:** `_project/specs/2026-09-01-quarto-project-structure-design.md`

## Global Constraints

- Preserve `/`, `/about.html`, `/blog.html`, `/publication.html`, and all current `/posts/.../` routes.
- Do not introduce a bundler, package manager, asset manifest, or new template framework.
- Do not alter publication content, page design, R analysis logic, or frozen aggregate results except where paths or data-availability prose require it.
- Keep restricted participant-level datasets outside the repository.
- Keep `_extensions/`, `_freeze/`, `.Rprofile`, `renv/`, `renv.lock`, root `.nojekyll`, and all active post bundles.
- Run Quarto checks sequentially to avoid `site_libs` races.
- Do not edit `docs/` by hand or regenerate the real `docs/` tree until the user approves the render gate.
- Do not stage broadly; no commit, push, publish, or deployment is authorized by this plan.

---

### Task 1: Make tests safe and align their names with the design

**Files:**
- Modify: `tests/homepage-hero.sh`
- Move: `tests/publication-cards.sh` to `tests/publication-listing.sh`
- Modify: `tests/home-particles.test.mjs`
- Modify: `tests/publication-interactions.test.mjs`

**Interfaces:**
- Consumes: current QMD pages, CSS/JS files, publication YAML, and EJS template.
- Produces: isolated render tests that do not change the repository `docs/` directory and test imports pointing to the target asset paths.

- [x] **Step 1: Update JavaScript test imports before moving source files**

Change the imports to:

```js
const script = await readFile(
  new URL("../assets/js/home.js", import.meta.url),
  "utf8",
);
```

and:

```js
script = await readFile(
  new URL("../assets/js/publication.js", import.meta.url),
  "utf8",
);
```

- [x] **Step 2: Run the two JavaScript tests and verify the new paths fail**

Run:

```sh
node --test tests/home-particles.test.mjs
node --test tests/publication-interactions.test.mjs
```

Expected: both fail because `assets/js/home.js` and
`assets/js/publication.js` do not exist yet.

- [x] **Step 3: Rename and update the publication render test**

Rename `tests/publication-cards.sh` to `tests/publication-listing.sh`. Replace
temporary names containing `publication-cards` with `publication-listing`,
update the final message to say `publication list`, and change required output
paths to:

```sh
rg -q 'href="assets/css/publication.css"' "$page"
rg -q 'src="assets/js/publication.js"' "$page"
```

- [x] **Step 4: Isolate the homepage render test**

Use the same temporary-copy pattern as the publication test:

```sh
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d /private/tmp/tzuyaolin-site-smoke.XXXXXX)"
trap 'rm -rf "$test_root"' EXIT

rsync -a \
  --exclude='.git' \
  --exclude='.quarto' \
  --exclude='_site' \
  --exclude='docs' \
  "$repo_root/" "$test_root/"
```

Run all test and render commands from `test_root`, then update asset assertions
to:

```sh
assert_contains 'src="assets/images/home-trajectory.png"'
assert_contains 'href="assets/css/home.css"'
assert_contains 'src="assets/js/home.js"'
assert_about_contains 'src="assets/images/profile-2024.jpg"'
```

- [x] **Step 5: Confirm the render tests still fail before the moves**

Run:

```sh
bash tests/homepage-hero.sh
bash tests/publication-listing.sh
```

Expected: failures identify missing target asset, data, or template paths; the
repository `docs/` status must not change as a consequence of either test.

- [x] **Step 6: Review checkpoint**

Run `git diff --check -- tests/` and inspect the exact test rename and path-only
changes. Do not commit.

---

### Task 2: Move homepage and About assets

**Files:**
- Move: `home.css` to `assets/css/home.css`
- Move: `home.js` to `assets/js/home.js`
- Move: `assets/home-trajectory.png` to `assets/images/home-trajectory.png`
- Move: `profile-2024.jpg` to `assets/images/profile-2024.jpg`
- Modify: `index.qmd`
- Modify: `about.qmd`

**Interfaces:**
- Consumes: target paths established by Task 1.
- Produces: homepage and About page sources whose declared and inline resources resolve under `assets/`.

- [x] **Step 1: Create responsibility-based asset directories**

Create `assets/css/`, `assets/js/`, and `assets/images/`. Keep the existing
`assets/fonts/` directory unchanged.

- [x] **Step 2: Move the four assets without changing their content**

Move each file to the target path listed above. Confirm the old paths no longer
exist and the new paths have the same byte sizes as before the move.

- [x] **Step 3: Update homepage metadata and markup**

Use:

```yaml
css: assets/css/home.css
resources:
  - assets/js/home.js
  - assets/images/home-trajectory.png
```

and update raw HTML to:

```html
<img class="trajectory-layer" src="assets/images/home-trajectory.png" alt="">
<script src="assets/js/home.js"></script>
```

- [x] **Step 4: Update the About portrait path**

Use:

```yaml
image: assets/images/profile-2024.jpg
```

- [x] **Step 5: Run focused tests**

Run:

```sh
node --test tests/home-particles.test.mjs
bash tests/homepage-hero.sh
```

Expected: both pass, and `git status --short docs` is unchanged from the
pre-task snapshot.

- [x] **Step 6: Review checkpoint**

Run `git diff --check -- index.qmd about.qmd tests/homepage-hero.sh tests/home-particles.test.mjs`
and inspect the moved paths. Do not commit.

---

### Task 3: Move the publication source components

**Files:**
- Move: `publication.css` to `assets/css/publication.css`
- Move: `publication.js` to `assets/js/publication.js`
- Move: `publications.yml` to `data/publications.yml`
- Move: `publication-listing.ejs` to `includes/publications/listing.ejs`
- Modify: `publication.qmd`
- Test: `tests/publication-interactions.test.mjs`
- Test: `tests/publication-listing.sh`

**Interfaces:**
- Consumes: existing publication YAML schema and EJS markup contract.
- Produces: `publication.qmd` references to the new data, template, style, and script locations without changing rendered publication content.

- [x] **Step 1: Create the publication include directory and move files**

Create `includes/publications/`, then move all four source files to the target
paths. Do not change YAML records, EJS markup, CSS rules, or JavaScript behavior
during the move.

- [x] **Step 2: Update publication page metadata**

Use:

```yaml
css: assets/css/publication.css
resources:
  - assets/js/publication.js
listing:
  id: publication-list
  contents: data/publications.yml
  type: custom
  template: includes/publications/listing.ejs
```

Update the raw script reference to:

```html
<script src="assets/js/publication.js"></script>
```

- [x] **Step 3: Run publication tests**

Run:

```sh
node --test tests/publication-interactions.test.mjs
bash tests/publication-listing.sh
```

Expected: both pass with seven entries, six DOI links, one preprint, two related
posts, seven self-author highlights, citation-copy controls, and abstract
controls.

- [x] **Step 4: Confirm no legacy source references remain**

Run:

```sh
rg -n '(^|[/: ])(home|publication)\.(css|js)|assets/home-trajectory|profile-2024\.jpg|contents: publications\.yml|template: publication-listing\.ejs' \
  --glob '!docs/**' --glob '!_site/**' --glob '!.git/**' .
```

Expected: only target `assets/...` paths and intentional historical mentions in
the spec or plan.

- [x] **Step 5: Review checkpoint**

Run `git diff --check` and inspect publication source and test diffs. Do not
commit.

---

### Task 4: Put post metadata and privacy guidance with the posts

**Files:**
- Move: `_metadata.yml` to `posts/_metadata.yml`
- Modify: `posts/_metadata.yml`
- Modify: `posts/20240918_CDP/index.qmd`
- Modify: `posts/20250328_VHS/index.qmd`
- Delete after merge: `data/CDP-data.md`
- Delete after merge: `data/Brazil-vaccine-survey.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: the existing data-access environment variables `CDP_DATA_PATH` and `BRAZIL_DATA_PATH`.
- Produces: stable `Data availability and privacy` headings inside both posts and post-scoped metadata without duplicate freeze configuration.

- [x] **Step 1: Move and simplify post metadata**

Move `_metadata.yml` to `posts/_metadata.yml` and retain:

```yaml
# Options specified here apply to all posts in this directory.
title-block-banner: true
```

Do not repeat `freeze: true`; `_quarto.yml` already owns that global setting.

- [x] **Step 2: Add the CDP data-availability section**

Replace the current external note link in `posts/20240918_CDP/index.qmd` with a
local section headed:

```markdown
# Data availability and privacy
```

The section must state that the participant-level data are restricted, sharing
depends on consent/data-use/ethics/institutional requirements, authorised users
must supply `CDP_DATA_PATH` from outside the repository, and public output must
remain aggregate. Preserve the existing analysis code unchanged.

- [x] **Step 3: Consolidate the vaccine privacy explanation**

Add a `Data availability and privacy` heading to the existing explanation in
`posts/20250328_VHS/index.qmd`. Merge only the unique warning about potentially
identifying combinations and keep the existing `BRAZIL_DATA_PATH` workflow.
Do not duplicate paragraphs or alter any R code, model, result, or frozen output.

- [x] **Step 4: Update README links and structure documentation**

Replace the obsolete `research/` entry with the four top-level pages and the
new `assets/`, `data/`, `includes/`, `_project/`, `posts/`, `tests/`, `_freeze/`,
`renv/`, and `docs/` responsibilities. Link privacy guidance to:

```markdown
posts/20240918_CDP/index.qmd#data-availability-and-privacy
posts/20250328_VHS/index.qmd#data-availability-and-privacy
```

- [x] **Step 5: Verify merged content before deleting source notes**

Run targeted `rg` checks for every policy concept and both environment-variable
names in the destination posts. Compare the old note content line-by-line; only
then remove `data/CDP-data.md` and `data/Brazil-vaccine-survey.md`.

> **Execution result (2026-09-01):** User-provided external data paths were
> verified without copying either dataset into the repository. Normal isolated
> renders completed all 37 CDP steps and all 65 vaccine-survey steps, refreshed
> both frozen outputs, and removed the obsolete standalone-note links. Repeated
> vaccine-survey renders exposed nondeterministic factor labels; a fixed seed
> now makes those results reproducible across renders.

- [x] **Step 6: Verify post-scoped metadata from an isolated copy**

Run `quarto inspect` inside a temporary repository copy and verify all four post
inputs inherit `title-block-banner: true` while the four top-level pages retain
their explicit page metadata. Confirm the two standalone data-note inputs are
absent. The final eight-input boundary check occurs after cleanup in Task 6.

- [x] **Step 7: Review checkpoint**

Inspect prose diffs separately from source path moves. Run `git diff --check`
and do not commit.

---

### Task 5: Remove obsolete state and establish durable root resources

**Files:**
- Create: `robots.txt`
- Delete: `design-qa.md`
- Delete: `profile.jpg`
- Delete: `tzuyaolin_blog.Rproj`
- Delete: `.Rhistory`
- Delete: `.Rproj.user/`
- Delete: all project `.DS_Store` files
- Delete: tracked legacy `_site/`
- Modify: `.gitignore` only if verification finds a missing ignore rule

**Interfaces:**
- Consumes: the current `docs/robots.txt` sitemap line and completed durable tests.
- Produces: one root source for robots policy and no duplicate output or editor-specific state.

- [x] **Step 1: Add the robots source**

Create root `robots.txt` with:

```text
Sitemap: https://tzuyao-lin.github.io/sitemap.xml
```

- [x] **Step 2: Reconfirm deletion targets**

Use `rg` and `git ls-files` to confirm `profile.jpg`, `design-qa.md`,
`tzuyaolin_blog.Rproj`, and `_site/` have no active source references. Confirm
`.Rproj.user/`, `.Rhistory`, and `.DS_Store` are ignored local state.

- [x] **Step 3: Remove only the confirmed targets**

Delete the exact paths listed for this task. Do not touch `_freeze/`,
`_extensions/`, `.Rprofile`, `renv/`, `renv.lock`, `docs/`, or any post image.

- [x] **Step 4: Verify ignore policy**

Confirm `.gitignore` still covers `.Rproj.user`, `.Rhistory`, `.RData`,
`.Ruserdata`, `/.quarto/`, `/_site/`, `.DS_Store`, restricted DTA/CSV paths, and
`**/*.quarto_ipynb`. Make no edit if all rules already exist.

- [x] **Step 5: Review checkpoint**

Inspect the exact deletion list with `git status --short` and verify retained
files still exist. Do not commit.

---

### Task 6: Source-only verification and render-gate handoff

**Files:**
- Verify: all source, test, internal documentation, and retained reproducibility files
- Do not modify: `docs/`

**Interfaces:**
- Consumes: Tasks 1 through 5.
- Produces: evidence that the reorganized source tree is ready for a separately approved full render.

- [x] **Step 1: Run unit tests sequentially**

```sh
node --test tests/home-particles.test.mjs
node --test tests/publication-interactions.test.mjs
```

Expected: zero failures.

- [x] **Step 2: Run isolated render tests sequentially**

```sh
bash tests/homepage-hero.sh
bash tests/publication-listing.sh
```

Expected: both report `PASS` and do not alter repository `docs/` status.

- [x] **Step 3: Run isolated full-project inspection and render**

Copy the project to a fresh temporary directory excluding `.git`, `.quarto`,
`_site`, and `docs`. Run `quarto inspect`, then `quarto render` using the tracked
freeze output. Confirm all four main routes and all four post routes exist.

- [x] **Step 4: Verify output boundaries and privacy**

Confirm the isolated output contains the relocated CSS, JavaScript, images,
fonts, `.nojekyll`, `robots.txt`, sitemap, and search index. Confirm it contains
no `data/*.html`, `design-qa.html`, `research/`, `.dta`, restricted CSV,
expanded private dataset path or other private absolute filesystem path. The
publicly documented environment-variable names may remain visible in code.

- [x] **Step 5: Verify repository integrity**

Run:

```sh
git diff --check
git status --short --untracked-files=all
```

Inspect every modified, moved, deleted, and new path. Separate pre-existing
generated `docs/` changes from this source reorganization.

- [x] **Step 6: Stop at the real-render gate**

Report source changes, deleted files, test results, isolated-render results,
and current `docs/` status. Ask for approval before rendering the real project,
previewing updated `docs/`, staging, committing, pushing, or deploying.
