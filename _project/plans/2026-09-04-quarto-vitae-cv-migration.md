# Quarto Vitae Academic CV Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one complete, locally reviewable academic CV PDF in the `tzuyaolin_blog` repository using Quarto Vitae and shared website data.

**Architecture:** Add an isolated Quarto subproject under `cv/`. Website publications and presentations remain the authoritative shared datasets; CV-only facts live in `data/cv/`. A small R adapter validates and converts both datasets into Quarto Vitae entry tables without changing the current website build.

**Tech Stack:** Quarto 1.10.18, Quarto Vitae AwesomeCV extension, R 4.6.1, knitr, yaml, dplyr, tibble, XeLaTeX from TeX Live 2026

**Spec:** `_project/specs/2026-09-04-quarto-vitae-cv-migration-design.md`

## Global Constraints

- Produce the full academic CV first. Keep the data and adapter reusable for a
  later two-page or targeted variant, but do not render that variant in this task.
- Keep `data/publications.yml` and `data/presentations.yml` unchanged and use their current 7 and 9 records respectively.
- Do not import obsolete publication records from the legacy CV repository.
- Use the blog for the current joint-PhD profile and education entry, including
  `tzu-yao.lin@kuleuven.be`; migrate the remaining non-publication records from
  inline tibbles in `TzuYaoLin_CV.Rmd` and record questionable facts separately.
- Keep draft output under `cv/_output/`; do not copy it to `docs/` or add a public website link.
- Do not change or delete the legacy CV repository.
- Do not commit or push without a separate user review and approval.
- Work one task at a time and show its verification before starting the next task.

## File map

- Create `data/cv/profile.yml`: Quarto header metadata migrated from the old Rmd.
- Create `data/cv/education.yml`: one joint-PhD record and two past-degree records.
- Create `data/cv/awards.yml`: five award records.
- Create `data/cv/research.yml`: nine research experience records.
- Create `data/cv/teaching.yml`: four teaching assistant records.
- Create `data/cv/coursework.yml`: ten graduate course records.
- Create `data/cv/training.yml`: three training records.
- Create `data/cv/skills.yml`: fourteen individual skill records.
- Create `data/cv/extracurricular.yml`: seven extracurricular records.
- Create `cv/R/load-cv-data.R`: YAML loading, validation, sorting, and Vitae field mapping.
- Create `cv/tests/test-data.R`: record-count, required-field, uniqueness, and mapping checks.
- Create `cv/_quarto.yml`: isolated default project configuration and profile metadata include.
- Create `cv/academic-cv.qmd`: section order and Vitae entry cells.
- Create `cv/README.md`: isolated render command and data-source documentation.
- Create `cv/content-review.md`: non-rendered list of stale or ambiguous facts.
- Create `cv/_extensions/quarto-vitae/awesomecv/**`: pinned project-local Quarto Vitae extension.
- Modify `.gitignore`: ignore `/cv/_output/` and `/cv/.quarto/` only.

---

### Task 1: Migrate CV-only facts to YAML

**Files:**
- Create: `cv/tests/test-data.R`
- Create: `data/cv/profile.yml`
- Create: `data/cv/education.yml`
- Create: `data/cv/awards.yml`
- Create: `data/cv/research.yml`
- Create: `data/cv/teaching.yml`
- Create: `data/cv/coursework.yml`
- Create: `data/cv/training.yml`
- Create: `data/cv/skills.yml`
- Create: `data/cv/extracurricular.yml`
- Reference: `/Users/tzuyaolin/Library/CloudStorage/OneDrive-Personal/Application/CV/TzuYaoLin_CV.Rmd:1`

**Interfaces:**
- Consumes: Inline tibble records in the legacy Rmd.
- Produces: Named profile metadata and YAML record lists with stable `id` values for Task 2.

- [x] **Step 1: Write the failing data-presence and count test**

Create `cv/tests/test-data.R` with a repository-root argument and exact expected counts:

```r
args <- commandArgs(trailingOnly = TRUE)
repo_root <- if (length(args)) args[[1]] else "."

read_yaml_file <- function(path) {
  if (!file.exists(path)) stop("Missing YAML file: ", path, call. = FALSE)
  yaml::read_yaml(path)
}

expected_counts <- c(
  education = 3L,
  awards = 5L,
  research = 9L,
  teaching = 4L,
  coursework = 10L,
  training = 3L,
  skills = 14L,
  extracurricular = 7L
)

profile <- read_yaml_file(file.path(repo_root, "data", "cv", "profile.yml"))
stopifnot(identical(profile$name, "Tzu-Yao"))
stopifnot(identical(profile$surname, "Lin"))
stopifnot(identical(profile$position, "Joint PhD candidate"))
stopifnot(identical(profile$email, "tzu-yao.lin@kuleuven.be"))

for (section in names(expected_counts)) {
  records <- read_yaml_file(file.path(repo_root, "data", "cv", paste0(section, ".yml")))
  stopifnot(length(records) == expected_counts[[section]])
  ids <- vapply(records, function(x) x$id %||% "", character(1))
  stopifnot(all(nzchar(ids)), !anyDuplicated(ids))
}

cat("CV YAML counts and IDs passed\n")
```

Define `%||%` at the top of the test so missing IDs fail clearly:

```r
`%||%` <- function(x, y) if (is.null(x)) y else x
```

- [x] **Step 2: Run the test and verify it fails before data creation**

Run from the website repository root:

```bash
Rscript --vanilla cv/tests/test-data.R .
```

Expected: failure naming `data/cv/profile.yml` as missing.

- [x] **Step 3: Transcribe the profile and eight record lists**

Use lower-kebab-case IDs. Preserve factual text from the inline tibbles, but replace presentation-only LaTeX commands such as `\\textbf{}`, `\\url{}`, and `\\emoji{}` with plain Markdown or plain text. Required keys by file are:

```yaml
# profile.yml
name: Tzu-Yao
surname: Lin
position: Joint PhD candidate
email: tzu-yao.lin@kuleuven.be
www: https://tzuyao-lin.github.io/
github: tzuyao-lin
orcid: 0000-0002-2261-448X
linkedin: tzu-yao-nick-lin
aboutme: >-
  I am a quantitative psychologist and joint PhD candidate at KU Leuven and
  Maastricht University. My research focuses on reliability in multilevel and
  intensive longitudinal data, with broader interests in longitudinal and
  multilevel modeling and mathematical and computational models of judgment and
  decision-making.
```

```yaml
# education.yml record schema
- id: joint-phd-ku-leuven-maastricht
  degree: Joint PhD candidate
  institution: KU Leuven and Maastricht University
  location: Leuven, Belgium and Maastricht, Netherlands
  start_date: 2022
  end_date: Present
  details: >-
    Research Group of Quantitative Psychology and Individual Differences;
    Department of Methodology and Statistics
```

Use these exact schemas for the remaining files:

```text
awards:         id, award, date, organization, details
research:       id, role, topic, supervisor, start_date, end_date, details
teaching:       id, title, code, semester, score
coursework:     id, title, code, semester, grade
training:       id, institution, date, course, location, details
skills:         id, category, skill
extracurricular:id, organization, date, role, location, details
```

Keep empty values as quoted empty strings so the adapter receives character data.

- [x] **Step 4: Run the count test**

```bash
Rscript --vanilla cv/tests/test-data.R .
```

Expected: `CV YAML counts and IDs passed`.

- [x] **Step 5: Review the migration diff without committing**

```bash
git diff -- data/cv cv/tests/test-data.R
git status --short
```

Expected: only the nine YAML files, test file, approved spec, and plan are new; no website data or `docs/` changes.

---

### Task 2: Add validated R data adapter

**Files:**
- Create: `cv/R/load-cv-data.R`
- Modify: `cv/tests/test-data.R`

**Interfaces:**
- Consumes: `load_cv_data(repo_root)` where `repo_root` is a character path.
- Produces: A named list of tibbles plus mapping functions `education_entries()`, `publication_entries()`, `presentation_entries()`, `award_entries()`, `research_entries()`, `teaching_entries()`, `coursework_entries()`, `training_entries()`, `skill_entries()`, and `extracurricular_entries()`. Every mapping returns a tibble using only `what`, `with`, `when`, `where`, and `why` as applicable.

- [x] **Step 1: Extend the test with failing loader assertions**

Append to `cv/tests/test-data.R`:

```r
source(file.path(repo_root, "cv", "R", "load-cv-data.R"))
cv <- load_cv_data(repo_root)

stopifnot(nrow(cv$publications) == 7L)
stopifnot(nrow(cv$presentations) == 9L)
stopifnot(nrow(cv$education) == 3L)
stopifnot(identical(names(education_entries(cv$education)),
                    c("what", "with", "when", "where", "why")))
stopifnot(identical(names(publication_entries(cv$publications)),
                    c("what", "with", "when", "where", "why")))
stopifnot(all(grepl("^\\d{4}$|^Under review$", publication_entries(cv$publications)$when)))
stopifnot(!anyDuplicated(cv$publications$id))
stopifnot(!anyDuplicated(cv$presentations$id))

cat("CV loader and entry mappings passed\n")
```

- [x] **Step 2: Run the test and verify the missing loader failure**

```bash
Rscript --vanilla cv/tests/test-data.R .
```

Expected: failure because `cv/R/load-cv-data.R` does not exist.

- [x] **Step 3: Implement strict YAML loading**

Create `cv/R/load-cv-data.R` with:

```r
`%||%` <- function(x, y) if (is.null(x)) y else x

read_record_file <- function(path, required) {
  if (!file.exists(path)) stop("Missing YAML file: ", path, call. = FALSE)
  records <- yaml::read_yaml(path)
  if (!is.list(records) || !length(records)) {
    stop("Expected a non-empty YAML record list: ", path, call. = FALSE)
  }

  for (i in seq_along(records)) {
    record <- records[[i]]
    id <- record$id %||% paste0("record-", i)
    missing <- required[vapply(required, function(key) {
      is.null(record[[key]]) || identical(record[[key]], "")
    }, logical(1))]
    if (length(missing)) {
      stop(path, " [", id, "] missing: ", paste(missing, collapse = ", "), call. = FALSE)
    }
  }

  result <- dplyr::bind_rows(records)
  if (anyDuplicated(result$id)) stop("Duplicate IDs in ", path, call. = FALSE)
  result
}

load_cv_data <- function(repo_root = "..") {
  cv_dir <- file.path(repo_root, "data", "cv")
  list(
    profile = yaml::read_yaml(file.path(cv_dir, "profile.yml")),
    education = read_record_file(file.path(cv_dir, "education.yml"), c("id", "degree", "institution", "location", "start_date", "end_date")),
    awards = read_record_file(file.path(cv_dir, "awards.yml"), c("id", "date", "organization", "details")),
    research = read_record_file(file.path(cv_dir, "research.yml"), c("id", "role", "topic", "supervisor", "start_date", "end_date", "details")),
    teaching = read_record_file(file.path(cv_dir, "teaching.yml"), c("id", "title", "code", "semester")),
    coursework = read_record_file(file.path(cv_dir, "coursework.yml"), c("id", "title", "code", "semester", "grade")),
    training = read_record_file(file.path(cv_dir, "training.yml"), c("id", "institution", "date", "course", "location")),
    skills = read_record_file(file.path(cv_dir, "skills.yml"), c("id", "category", "skill")),
    extracurricular = read_record_file(file.path(cv_dir, "extracurricular.yml"), c("id", "organization", "date", "role", "location")),
    publications = read_record_file(file.path(repo_root, "data", "publications.yml"), c("id", "status", "authors", "title", "venue")),
    presentations = read_record_file(file.path(repo_root, "data", "presentations.yml"), c("id", "date", "title", "venue", "location", "type"))
  )
}
```

- [x] **Step 4: Implement entry mappings**

Add a helper that always returns character columns and substitutes empty strings for absent optional fields:

```r
as_text <- function(x, n) {
  if (is.null(x)) rep("", n) else ifelse(is.na(x), "", as.character(x))
}

span <- function(start, end) paste0(start, "--", end)

education_entries <- function(x) dplyr::transmute(
  x, what = degree, with = institution, when = span(start_date, end_date),
  where = location, why = as_text(details, dplyr::n())
)

publication_entries <- function(x) {
  n <- nrow(x)
  year <- as_text(x$year, n)
  when <- ifelse(x$status == "under-review", "Under review", year)
  doi <- as_text(x$doi, n)
  preprint <- as_text(x$preprint, n)
  why <- ifelse(nzchar(doi), paste0("[DOI](https://doi.org/", doi, ")"),
                ifelse(nzchar(preprint), paste0("[Preprint](", preprint, ")"), ""))
  tibble::tibble(what = x$title, with = x$authors, when = when,
                 where = x$venue, why = why)
}

presentation_entries <- function(x) tibble::tibble(
  what = x$title,
  with = x$venue,
  when = format(as.Date(x$date), "%b %Y"),
  where = x$location,
  why = x$type
)
```

Implement the remaining mappings using the file-map schemas:

```text
award:          what=organization, with=award, when=date, why=details
research:       what=role, with=topic, when=start_date--end_date, where=supervisor, why=details
teaching:       what="code: title", when=semester, with=score
coursework:     what="code: title", when=semester, with=grade
training:       what=institution, with=course, when=date, where=location, why=details
skills:         group by category; what=category, with=comma-separated skills
extracurricular:what=role, with=organization, when=date, where=location, why=details
```

- [x] **Step 5: Run loader tests**

```bash
Rscript --vanilla cv/tests/test-data.R .
```

Expected final lines:

```text
CV YAML counts and IDs passed
CV loader and entry mappings passed
```

- [x] **Step 6: Review without committing**

```bash
git diff -- cv/R/load-cv-data.R cv/tests/test-data.R data/cv
```

Expected: no edits to `data/publications.yml` or `data/presentations.yml`.

---

### Task 3: Add the isolated Quarto Vitae document

**Files:**
- Create: `cv/_quarto.yml`
- Create: `cv/academic-cv.qmd`
- Create: `cv/README.md`
- Create: `cv/_extensions/quarto-vitae/awesomecv/**`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `load_cv_data("..")` and all entry mapping functions from Task 2.
- Produces: `cv/_output/TzuYaoLin_CV.pdf` from `quarto render` inside `cv/`.

- [x] **Step 1: Add output-only ignore rules**

Append exactly:

```gitignore

# Local Quarto Vitae build artifacts
/cv/.quarto/
/cv/_output/
```

- [x] **Step 2: Install the extension locally**

Run from `cv/`:

```bash
quarto add --no-prompt quarto-vitae/awesomecv
```

Expected: `cv/_extensions/quarto-vitae/awesomecv/` is created. Keep it in version control so later renders do not download a moving dependency.

- [x] **Step 3: Configure the isolated subproject**

Create `cv/_quarto.yml`:

```yaml
project:
  type: default
  output-dir: _output
  execute-dir: project

metadata-files:
  - ../data/cv/profile.yml

format:
  awesomecv-pdf:
    papersize: a4
    fontsize: 10pt
    headcolor: "00295C"
    show_footer: true
    page_total: true

execute:
  echo: false
  warning: false
  message: false
```

- [x] **Step 4: Write the QMD using code-generated Vitae tables**

Create `cv/academic-cv.qmd` with this header and setup:

````markdown
---
format: awesomecv-pdf
output-file: TzuYaoLin_CV.pdf
date: last-modified
---

```{r}
#| label: setup
#| include: false
source("R/load-cv-data.R")
cv <- load_cv_data("..")
```
````

For each section, print its mapped tibble in a cell annotated for Vitae. Use `style: detailed` for education, publications, presentations, awards, research, training, and extracurricular activities; use `style: brief` for teaching and coursework; use `style: skills` for skills. Example:

````markdown
# Education

```{r}
#| vitae:
#|   style: detailed
education_entries(cv$education)
```
````

Use the exact section order from the spec: Education, Publications, Conference Presentations, Awards, Research Experience, Teaching Assistant Experience, Graduate-level Statistics and Modeling Coursework, Training, Skills, Extracurricular Activities.

- [x] **Step 5: Document and render the subproject**

```bash
cd cv
quarto render
```

Expected: `cv/_output/TzuYaoLin_CV.pdf` exists and the website `docs/` tree is unchanged.

- [x] **Step 6: Review build-related changes without committing**

```bash
git status --short
git diff -- .gitignore cv/_quarto.yml cv/academic-cv.qmd
git status --short docs
```

Expected: `git status --short docs` prints nothing.

---

### Task 4: Document stale content and verify the complete draft

**Files:**
- Create: `cv/content-review.md`
- Verify: `cv/_output/TzuYaoLin_CV.pdf`
- Verify unchanged: `data/publications.yml`
- Verify unchanged: `data/presentations.yml`
- Verify unchanged: `docs/`

**Interfaces:**
- Consumes: Rendered PDF and migrated YAML from Tasks 1–3.
- Produces: A reviewable PDF plus a concrete checklist for the next content-editing phase.

- [x] **Step 1: Create the factual-review checklist**

Record, without resolving, at least these concrete issues in `cv/content-review.md`:

```markdown
# Academic CV content review

- [ ] Confirm current GitHub username and personal website URL.
- [ ] Review the blog-derived joint-PhD profile summary.
- [ ] Confirm the joint-PhD expected/completion date.
- [ ] Review every research role still marked `Present`, especially roles begun in 2018 or 2021.
- [ ] Decide whether duplicate research-project rows should be merged.
- [ ] Resolve the award row with an empty award name for Spring 2015.
- [ ] Decide whether course grades, teaching evaluation scores, and extracurricular activities remain appropriate for a current academic CV.
- [ ] Decide whether historical presentations absent from the website dataset should be restored.
- [ ] Review capitalization, spelling, and institutional naming without changing factual meaning.
```

- [x] **Step 2: Run all data tests from a clean R process**

```bash
Rscript --vanilla cv/tests/test-data.R .
```

Expected: both success messages and exit status 0.

- [x] **Step 3: Re-render and inspect PDF metadata**

```bash
cd cv
quarto render
pdfinfo _output/TzuYaoLin_CV.pdf
```

Expected: an A4 PDF with at least one page and no render errors.

- [x] **Step 4: Verify machine-readable text and section coverage**

```bash
pdftotext cv/_output/TzuYaoLin_CV.pdf - | rg -n "Education|Publications|Conference Presentations|Awards|Research Experience|Teaching Assistant Experience|Coursework|Training|Skills|Extracurricular Activities"
```

Expected: every section heading is found. Extracted text must retain readable names, dates, and URLs rather than concatenating most words.

- [x] **Step 5: Visually inspect every PDF page**

Render PDF pages to images and check clipped text, overlapping dates, broken links, missing glyphs, large blank regions, and accidental blank pages. This is correctness QA only; defer typography and aesthetic changes.

- [x] **Step 6: Verify isolation and present the result**

```bash
git status --short docs data/publications.yml data/presentations.yml
git diff --check
git status --short
```

Expected: no changes under `docs/` and no changes to the two shared website datasets. Present the PDF, review checklist, changed-file list, test output, and diff summary to the user. Do not commit or push.
