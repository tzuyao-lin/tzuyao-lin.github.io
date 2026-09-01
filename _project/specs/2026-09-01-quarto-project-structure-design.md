# Quarto Project Structure Design

Status: revised design for user review; no file reorganization has been run.

## Goal

Reorganize the blog around Quarto's own project conventions so that each file
has one obvious home and one clear owner. The result should be easy to extend
without adding a framework, build script, or custom directory convention that
the project does not need.

The design follows five rules:

1. Keep Quarto entry pages and site-wide configuration at the project root.
2. Keep content-specific supporting files with the content that owns them.
3. Separate reusable browser assets from content and generated output.
4. Keep only one publishable output directory.
5. Use underscore-prefixed directories only where Quarto's render behavior
   gives the prefix a concrete purpose.

## Route contract

The following intended public routes must remain unchanged:

- `/`
- `/about.html`
- `/blog.html`
- `/publication.html`
- all current `/posts/.../` routes

The following pages are not treated as stable public routes:

- `/data/Brazil-vaccine-survey.html`
- `/data/CDP-data.html`
- `/design-qa.html`
- stale `/research/...` pages that no longer have source files

The two data-availability notes will be incorporated into their related posts.
The QA page and stale research pages are accidental generated pages rather than
reader-facing content. Removing them avoids maintaining duplicate or orphaned
pages. Redirects are outside this cleanup unless there is evidence that an old
URL is still linked externally.

## Target structure

```text
.
├── .gitattributes
├── .gitignore
├── .nojekyll
├── .Rprofile
├── _quarto.yml
├── index.qmd
├── about.qmd
├── blog.qmd
├── publication.qmd
├── styles.css
├── robots.txt
├── README.md
├── assets/
│   ├── css/
│   │   ├── home.css
│   │   └── publication.css
│   ├── js/
│   │   ├── home.js
│   │   └── publication.js
│   ├── images/
│   │   ├── home-trajectory.png
│   │   └── profile-2024.jpg
│   └── fonts/
├── data/
│   └── publications.yml
├── includes/
│   └── publications/
│       └── listing.ejs
├── _project/
│   ├── specs/
│   └── plans/
├── _extensions/
├── _freeze/
├── posts/
│   ├── _metadata.yml
│   ├── 20230703_welcome/
│   ├── 20240918_CDP/
│   ├── 20250328_VHS/
│   └── 20250330_PhD-position/
├── tests/
│   ├── home-particles.test.mjs
│   ├── homepage-hero.sh
│   ├── publication-interactions.test.mjs
│   └── publication-listing.sh
├── renv/
├── renv.lock
└── docs/
```

Local cache and editor-state directories such as `.quarto/`, `.Rproj.user/`,
and `renv/library/` remain ignored and are not part of the repository
structure.

## Why some names begin with an underscore

Quarto does not render files or directories whose names begin with `_`.
This project uses that behavior only for directories with an established or
necessary internal role:

- `_extensions/` is Quarto's standard location for extensions.
- `_freeze/` is Quarto's standard cache for frozen computation results.
- `_project/` is the one custom internal directory. It contains Markdown design
  and implementation documents that belong in Git but must never become website
  pages.
- `posts/_metadata.yml` is Quarto's standard directory-level metadata file.

`data/` and `includes/` do not need underscores. Their YAML and EJS files are
not valid page inputs, so the prefix would add naming ceremony without changing
render behavior. This keeps the distinction visible: underscore means Quarto
must treat the item specially, not merely that the item is technical.

## Directory responsibilities

### Root

Keep only files that configure the whole website, define a top-level route, or
document how to work with the repository:

- `_quarto.yml` owns site-wide configuration, global `styles.css`, navigation,
  output directory, site URL, and global freeze behavior.
- `index.qmd`, `about.qmd`, `blog.qmd`, and `publication.qmd` each own one stable
  public route.
- `styles.css` contains design tokens and styles shared across multiple pages.
- `.nojekyll` remains at the root so Quarto copies it into `docs/` for GitHub
  Pages.
- `robots.txt` becomes a root source file rather than a manually retained file
  inside generated output.

The current root `_metadata.yml` is moved to `posts/_metadata.yml`. Its comment
says it applies to posts, but at the root it actually applies across the whole
project. The post-local file should contain only post-wide presentation
defaults; `execute.freeze: true` remains in `_quarto.yml` and is not duplicated.

### Shared assets

`assets/` contains files loaded by more than one build step or referenced by a
top-level page:

- `assets/css/` contains page-specific styles. Global rules stay in
  `styles.css`.
- `assets/js/` contains page-specific interactions with no build pipeline.
- `assets/images/` contains images used by top-level pages.
- `assets/fonts/` retains the self-hosted font files and their licence texts.

No bundler, package manager, or asset manifest is introduced. The page metadata
continues to declare the CSS and resources it uses, making dependencies visible
from the owning QMD file.

### Publication data and renderer

- `data/publications.yml` is the single source of publication metadata.
- `includes/publications/listing.ejs` only converts that metadata into markup.
- `publication.qmd` owns the page composition and presentations section.
- `assets/css/publication.css` owns publication-only appearance.
- `assets/js/publication.js` owns abstract and citation-copy interactions.

This separation keeps content, rendering, styling, and behavior independently
editable without introducing a general template system. The removed Gang He
template or attribution is not reintroduced; no remaining source file depends
on it.

### Posts and data availability

Each `posts/<post>/` directory remains a self-contained content bundle holding
its `index.qmd`, post image, bibliography, CSL file, and post-specific code.
Existing post directory names are not changed because they form public URLs.

The content of the current data notes is merged into the related posts:

- `data/CDP-data.md` becomes a `Data availability and privacy` section in
  `posts/20240918_CDP/index.qmd`.
- `data/Brazil-vaccine-survey.md` is merged into the existing data-access and
  privacy explanation in `posts/20250328_VHS/index.qmd`, without duplicating
  text already present there.

The CDP post link and `README.md` links are updated to point to the relevant
post sections. After the merge, the two standalone Markdown files are removed.
This keeps the policy next to the code and analysis it governs and prevents
Quarto from publishing separate data-note pages.

### Internal project documentation

`_project/specs/` stores approved architecture decisions and
`_project/plans/` stores implementation plans. These files are tracked because
they explain intentional structure and cleanup decisions, while the underscore
keeps them out of the rendered site.

The current `design-qa.md` is deleted rather than moved. It is a one-time QA
record dominated by temporary screenshot paths and completed iteration history;
the durable behavior is already covered by tests. Retaining it would create a
stale maintenance document without adding reproducibility.

### Tests

Keep `tests/` at the repository root and track it in Git. Tests are source code
needed to verify future changes, not generated output.

- Keep the two JavaScript interaction tests.
- Keep the homepage render test, but make it render an isolated temporary copy
  so running it does not modify the tracked `docs/` directory.
- Rename `tests/publication-cards.sh` to
  `tests/publication-listing.sh`; the page intentionally does not use cards.
- Update assertions and script imports for the relocated asset paths.

The tests should verify behavior and required output, not historical visual QA
notes or temporary screenshot locations.

### R reproducibility

Delete `tzuyaolin_blog.Rproj`, `.Rproj.user/`, and `.Rhistory`. They are RStudio
workspace state and are not needed by Quarto, VS Code, Positron, or command-line
R.

Retain `.Rprofile`, `renv/`, and `renv.lock`:

- `.Rprofile` activates `renv` from the project root.
- `renv/activate.R` and `renv/settings.json` bootstrap the environment.
- `renv.lock` records packages used by the two R-based posts.
- local package libraries remain ignored by `renv/.gitignore`.

Retain and track `_freeze/` because the site contains restricted-data analyses.
Quarto recommends committing frozen computation results so a project render can
reuse approved aggregate output without access to private source data.

### Generated output

`docs/` remains the only tracked website output because GitHub Pages publishes
`main:/docs`. `_site/` is an obsolete second output tree and is removed.

Files inside `docs/` are never edited by hand. A clean full render recreates
them from source, including `.nojekyll`, `robots.txt`, the sitemap, search data,
page assets, and HTML. This also removes stale `docs/data/`, `docs/design-qa.html`,
and `docs/research/` pages that no longer have sources.

## Exact path updates

| Owner | Current path | Target path or action |
|---|---|---|
| Homepage CSS | `home.css` | `assets/css/home.css` |
| Homepage JavaScript | `home.js` | `assets/js/home.js` |
| Homepage trajectory | `assets/home-trajectory.png` | `assets/images/home-trajectory.png` |
| About portrait | `profile-2024.jpg` | `assets/images/profile-2024.jpg` |
| Publication CSS | `publication.css` | `assets/css/publication.css` |
| Publication JavaScript | `publication.js` | `assets/js/publication.js` |
| Publication records | `publications.yml` | `data/publications.yml` |
| Publication renderer | `publication-listing.ejs` | `includes/publications/listing.ejs` |
| Post metadata | `_metadata.yml` | `posts/_metadata.yml`, without duplicate freeze setting |
| CDP data note | `data/CDP-data.md` | merge into `posts/20240918_CDP/index.qmd` |
| Vaccine data note | `data/Brazil-vaccine-survey.md` | merge into `posts/20250328_VHS/index.qmd` |
| Publication shell test | `tests/publication-cards.sh` | `tests/publication-listing.sh` |
| QA history | `design-qa.md` | remove after durable checks are confirmed in tests |
| Robots source | `docs/robots.txt` only | add root `robots.txt`; regenerate `docs/robots.txt` |

References in `index.qmd`, `about.qmd`, `publication.qmd`, the relevant posts,
the test files, and `README.md` must be updated in the same implementation step
as each move so no intermediate path is left dangling.

## Cleanup scope

Remove these confirmed obsolete, redundant, or local-only items:

- tracked legacy `_site/` output
- `tzuyaolin_blog.Rproj`
- `.Rproj.user/`
- `.Rhistory`
- all `.DS_Store` files within the project
- unused `profile.jpg`
- standalone `data/Brazil-vaccine-survey.md` and `data/CDP-data.md` after their
  content is merged and verified
- `design-qa.md` after its durable assertions are confirmed in tests
- stale generated pages removed by the clean `docs/` render

Do not remove `_extensions/`, `_freeze/`, `.Rprofile`, `renv/`, `renv.lock`,
the current post bundles, root `.nojekyll`, or any active publication files.

## Git policy

- Continue tracking all four tests; rename the publication shell test through
  Git history rather than replacing it with an unrelated file.
- Track source assets, publication data, the EJS renderer, `_project/`
  documentation, `_freeze/`, the R environment bootstrap files, and `docs/`.
- Keep `.quarto/`, local R libraries, RStudio state, histories, OS metadata, and
  restricted participant-level datasets ignored.
- Review and stage exact paths only; do not use `git add .`.
- Treat source reorganization and regenerated `docs/` as separate review gates.
- Do not commit, push, publish, or deploy without separate user approval.

## Implementation order

1. Move non-generated source files and immediately update their references.
2. Merge and verify the two data-availability notes before deleting the old
   files.
3. Move post metadata and verify the effective metadata with `quarto inspect`.
4. Update and rename tests; run JavaScript tests and isolated render tests.
5. Remove confirmed legacy and local-only files.
6. Inspect the source-only diff and obtain approval before updating `docs/`.
7. Perform one clean full render to `docs/`, then inspect generated route and
   asset changes.
8. Preview Home, About, Posts, Publications, and both affected data-analysis
   posts before any commit decision.

## Verification

Run checks sequentially to avoid Quarto `site_libs` races:

1. `node --test tests/home-particles.test.mjs`
2. `node --test tests/publication-interactions.test.mjs`
3. `bash tests/homepage-hero.sh`
4. `bash tests/publication-listing.sh`
5. `quarto inspect` and confirm that only the four top-level QMD pages and the
   four post `index.qmd` files are render inputs.
6. Confirm `_project/` is absent from Quarto inputs and no standalone data or QA
   Markdown page remains.
7. Render the full site from an isolated temporary copy and confirm the intended
   routes, post routes, assets, `.nojekyll`, robots file, sitemap, and search
   index are produced.
8. Scan rendered HTML and metadata for old source paths, missing resources,
   private filesystem paths, and obsolete `/data/`, `/design-qa`, or `/research/`
   entries.
9. Run `git diff --check` and inspect `git status --short` plus the exact diff.
10. After a separately approved real render, preview the key pages at desktop
    and mobile widths, in light and dark themes, and check the browser console.

## Success criteria

- Every root file has a project-wide role or owns a top-level public route.
- Each shared asset, publication component, post bundle, test, internal note,
  R environment file, and generated file has exactly one documented location.
- Only Quarto-reserved or intentionally non-rendered internal items use an
  underscore prefix.
- The four main routes and all post routes remain unchanged.
- Data-availability guidance is present in the two related posts and nowhere
  duplicated.
- Quarto no longer renders internal QA, design, or standalone data-note pages.
- Tests run without modifying the real `docs/` directory.
- A clean full render contains no missing assets, stale pages, private paths, or
  browser console errors.
- No commit, push, publication, or deployment occurs without its own approval.
