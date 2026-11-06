# Academic CV

The website's Quarto project renders the full academic CV with Quarto Vitae
and the AwesomeCV extension in this directory.

The CV is not part of the default site render, so `quarto render` does not
compile it. `cv/TzuYaoLin_CV.pdf` is git-ignored: the Deploy workflow renders it
with `quarto render cv/academic-cv.qmd` before the site render, so every deploy
publishes a fresh PDF at `docs/cv/TzuYaoLin_CV.pdf`. The footer date is the
deploy day (`date: today`). The CI workflow renders the CV whenever its inputs
change, to catch build failures before merging. The same project `renv`
library is used for the site and CV.

To preview locally (needs TinyTeX), run from the repository root:

```sh
quarto render cv/academic-cv.qmd
```

Then run `quarto render` to copy the PDF into `docs/cv/`. Check the PDF by eye
after changing layout: fonts on macOS and the Ubuntu runner can differ slightly.

Publication and presentation records come from `../data/publications.yml` and
`../data/presentations.yml`. Other CV records come from `../data/cv/`. Keep
record data out of `academic-cv.qmd`; the QMD controls section order while
`R/load-cv-data.R` validates and maps shared data to Quarto Vitae fields.

Sections rendered in `academic-cv.qmd`: Education, Publications, Presentations,
Awards, Peer Review, Skills, Earlier Research Experience, and Teaching Assistant
Experience. To hide a record, comment it out in its YAML file (as done for the
2015 and 2017 awards and the profile `aboutme` summary); to drop a section,
remove its block from the QMD and, if the data is no longer needed, its YAML
file, its `read_record_file()` call, and its `*_entries()` function. Old
coursework, training, and extracurricular records live in git history.

Layout changes to the vendored AwesomeCV extension are marked `LOCAL` in
`_extensions/quarto-vitae/awesomecv/` (`awesome-cv.cls` and
`awesome-cv-preamble.tex`): larger regular-weight text, looser spacing, no
small caps, plain section headings, and `needspace` before section headings.
`cv/awesome-cv.cls` is a git-ignored copy that Quarto regenerates.

The shared data and mapping functions can later support a two-page or targeted
CV without duplicating the underlying records. This first migration renders
only the complete academic version.
