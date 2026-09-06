# Academic CV

This subproject renders the full academic CV with Quarto Vitae and its
project-local AwesomeCV extension.

From this directory, run:

```sh
quarto render
```

The draft PDF is written to `_output/TzuYaoLin_CV.pdf`. Run Quarto from this
directory, rather than from the website repository root, so the CV build stays
independent from the website project and its `renv` startup.

Publication and presentation records come from `../data/publications.yml` and
`../data/presentations.yml`. Other CV records come from `../data/cv/`. Keep
record data out of `academic-cv.qmd`; the QMD controls section order while
`R/load-cv-data.R` validates and maps shared data to Quarto Vitae fields.

The shared data and mapping functions can later support a two-page or targeted
CV without duplicating the underlying records. This first migration renders
only the complete academic version.
