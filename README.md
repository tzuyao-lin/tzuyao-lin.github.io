# Tzu-Yao Lin's academic website

This repository contains my academic profile and research blog. The site is built with [Quarto](https://quarto.org/) and is intended for potential research collaborators and people who work with statistics or R.

The primary language is English, while individual posts may also be published in Chinese in the future.

## Website structure

- `index.qmd`, `about.qmd`, `blog.qmd`, and `publication.qmd`: source files for
  the four main website routes
- `assets/`: shared CSS, JavaScript, images, and self-hosted fonts
- `data/`: structured data used to build site pages
- `cv/`: Quarto source for the academic CV PDF
- `includes/`: custom Quarto listing templates
- `posts/`: self-contained post bundles and their shared metadata
- `tests/`: JavaScript and isolated-render regression tests
- `_project/`: internal specifications and implementation plans that Quarto
  excludes from the website
- `_freeze/`: tracked Quarto computation results used to render analytical
  posts without re-running restricted-data analyses
- `renv/` and `renv.lock`: reproducible R environment metadata
- `docs/`: generated website published through GitHub Pages

## Build locally

The current reproducible build baseline uses R 4.6.1, Quarto 1.10.18, and
[`renv`](https://rstudio.github.io/renv/) for R package management. After
cloning or pulling a change to `renv.lock`, restore the project library from
the repository root:

```r
renv::restore()
```

Install [Quarto](https://quarto.org/docs/get-started/) separately, then render
the website:

```sh
quarto render
```

A full render builds the HTML pages only; it does not compile the CV. It copies
the tracked `cv/TzuYaoLin_CV.pdf` into `docs/cv/`, where both website CV links
point. After changing `data/cv/`, `data/publications.yml`,
`data/presentations.yml`, or `cv/`, rebuild the CV with
`quarto render cv/academic-cv.qmd`, commit the new `cv/TzuYaoLin_CV.pdf`, and
run `quarto render` to publish it to `docs/`. Otherwise the published PDF goes
stale.

### Setting up a new worktree

Each worktree has its own `renv/library/`, linked from the shared global renv
cache. Rendering the site needs no R packages, because the analytic posts are
frozen (`_freeze/`). Rendering the CV needs a small set:

```r
renv::restore(packages = c("knitr", "rmarkdown", "yaml", "dplyr", "tibble"))
```

This installs those packages and their dependencies (36 in total) at the
versions in `renv.lock`, normally from the cache without downloading. Run a full
`renv::restore()` only when re-executing the analytic posts, which also need
their restricted datasets. Note that rendering a post or `posts/` directly
(rather than the whole project) re-executes its code.

To preview local changes:

```sh
quarto preview
```

The rendered website is written to `docs/`. GitHub Pages currently publishes the `docs/` directory from the `main` branch.

When an R package is deliberately installed or updated, verify the site and
then record the new environment:

```r
renv::status()
renv::snapshot()
```

Commit the resulting `renv.lock` change together with the source change that
requires it. The project library under `renv/library/` remains local and is
not committed.

## Content and data

Posts should include enough information to identify their data source, licence or reuse conditions, and any steps taken to protect participant privacy. Public data files must be reviewed for direct identifiers, detailed timestamps, network identifiers, and free-text responses before they are committed.

