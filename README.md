# Tzu-Yao Lin's academic website

This repository contains my academic profile and research blog. The site is built with [Quarto](https://quarto.org/) and is intended for potential research collaborators and people who work with statistics or R.

The primary language is English, while individual posts may also be published in Chinese in the future.

## Website structure

- `index.qmd`: homepage, biography, research profile, and contact links
- `blog.qmd`: research, statistics, and R posts
- `research/`: publications and presentations
- `posts/`: source files and supporting materials for posts
- `docs/`: rendered website published through GitHub Pages

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

Participant-level datasets are deliberately excluded from this public repository. See [`data/Brazil-vaccine-survey.md`](data/Brazil-vaccine-survey.md) and [`data/CDP-data.md`](data/CDP-data.md) for the access and privacy policies used by those posts.
