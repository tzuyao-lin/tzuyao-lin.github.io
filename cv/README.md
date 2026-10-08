# Academic CV

The website's Quarto project renders the full academic CV with Quarto Vitae
and the AwesomeCV extension in this directory.

From the repository root, run:

```sh
quarto render
```

This builds the site and writes the CV directly to `docs/cv/TzuYaoLin_CV.pdf`
for GitHub Pages. To render only the CV, run
`quarto render cv/academic-cv.qmd` from the repository root. The same project
`renv` library is used for the site and CV.

Publication and presentation records come from `../data/publications.yml` and
`../data/presentations.yml`. Other CV records come from `../data/cv/`. Keep
record data out of `academic-cv.qmd`; the QMD controls section order while
`R/load-cv-data.R` validates and maps shared data to Quarto Vitae fields.

The shared data and mapping functions can later support a two-page or targeted
CV without duplicating the underlying records. This first migration renders
only the complete academic version.
