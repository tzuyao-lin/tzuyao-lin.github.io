# Quarto Vitae Academic CV Migration Design

Date: 2026-09-04

## Goal

Create a complete, reviewable academic CV inside the `tzuyaolin_blog`
repository using Quarto Vitae. The first version prioritizes content coverage and
reliable rendering. Its shared data and adapter must remain reusable for a later
two-page CV, while content pruning and visual customization remain later phases.

## Scope boundaries

- The first deliverable is one full academic CV PDF.
- The PDF remains a local draft under `cv/_output/`; it is not copied into
  `docs/`, linked from the website, committed, or pushed until the user reviews
  its content.
- Existing website publication and presentation data remain unchanged during
  this migration.
- `data/publications.yml` and `data/presentations.yml` are the authoritative
  sources for those two CV sections. Obsolete publication records from the old
  CV repository are not imported.
- Current profile and joint-PhD information comes from the blog, with the user's
  KU Leuven email replacing the outdated Maastricht email.
- Past education and all other CV sections are migrated from the rendered
  content currently used by `TzuYaoLin_CV.Rmd`. The old CSV files are reference
  material only because the Rmd currently uses inline tibbles instead.
- Other outdated facts are migrated as-is and listed for later review; they are
  not silently corrected or omitted.
- The existing CV repository remains untouched as a legacy reference.

## Repository structure

```text
tzuyaolin_blog/
├── data/
│   ├── publications.yml
│   ├── presentations.yml
│   └── cv/
│       ├── profile.yml
│       ├── education.yml
│       ├── awards.yml
│       ├── research.yml
│       ├── teaching.yml
│       ├── coursework.yml
│       ├── training.yml
│       ├── skills.yml
│       └── extracurricular.yml
└── cv/
    ├── _quarto.yml
    ├── academic-cv.qmd
    ├── R/
    │   └── load-cv-data.R
    ├── _extensions/
    │   └── quarto-vitae/
    │       └── awesomecv/
    ├── content-review.md
    └── _output/
        └── TzuYaoLin_CV.pdf
```

The `cv/` directory is an independent Quarto subproject. This isolates its
XeLaTeX dependency and failures from the website build while keeping the CV and
website in the same Git repository. The extension is installed locally in the
CV subproject for reproducibility.

## Data flow and responsibilities

1. YAML files store CV facts and contain no layout code.
2. `cv/R/load-cv-data.R` reads the YAML files, validates required fields, sorts
   records, and maps them to Quarto Vitae's `what`, `with`, `when`, `where`, and
   `why` entry fields.
3. `cv/academic-cv.qmd` defines section order and short prose only. It does not
   duplicate records from YAML.
4. Quarto Vitae's AwesomeCV format converts the entries to PDF with XeLaTeX.
5. The website continues to read the existing publication and presentation
   YAML through its current EJS listings.

The adapter must fail with a clear filename and record identifier if a required
field is missing. It must not silently drop malformed entries.

## First-version sections

The first rendered CV contains:

1. Current profile and joint-PhD summary based on the blog
2. Education, with one joint-PhD entry followed by past degrees
3. Publications from the website dataset
4. Conference presentations from the website dataset
5. Awards
6. Research experience
7. Teaching assistant experience
8. Graduate-level statistics and modeling coursework
9. Training
10. Skills
11. Extracurricular activities

No new claims or inferred dates are introduced during migration.

## Migration sequence

Each step is reviewed and verified independently:

1. Add the isolated Quarto CV project and pin the Quarto Vitae extension.
2. Migrate profile and education data, then validate YAML parsing.
3. Migrate awards and research experience, then validate record counts.
4. Migrate teaching, coursework, training, skills, and extracurricular data,
   validating each source against the old rendered Rmd content.
5. Add the R data adapter and automated field validation.
6. Build the QMD using website publications and presentations plus the migrated
   CV-only data.
7. Render the draft PDF and inspect section coverage, order, links, special
   characters, page breaks, and machine-readable text.
8. Create `content-review.md` listing stale or ambiguous facts without changing
   them.
9. Present the PDF and migration diff for user review. Publishing and visual
   customization are separate, later approvals.

## Verification criteria

- Both website YAML files parse successfully and retain their original record
  counts and content.
- Every inline record currently rendered by the old Rmd outside publications
  and presentations has a corresponding migrated YAML record.
- All intended sections appear in the PDF in the documented order.
- The render completes from a clean R session using the repository's declared
  dependencies and the locally installed extension.
- PDF text extraction preserves names, dates, headings, and URLs in readable
  order.
- The website repository has no unintended changes in `docs/` or existing
  website source files.

## Deferred decisions

- Correcting remaining outdated employment and historical information
- Adding or removing historical records
- Normalizing publication authors and generating APA/BibTeX automatically
- Rendering a two-page application CV or other variants from the shared data
- Font, color, spacing, page-count, and template customization
- Copying the approved PDF into `docs/files/` and adding a public download link
