`%||%` <- function(x, y) if (is.null(x)) y else x

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
  records <- read_yaml_file(
    file.path(repo_root, "data", "cv", paste0(section, ".yml"))
  )
  stopifnot(length(records) == expected_counts[[section]])
  ids <- vapply(records, function(x) x$id %||% "", character(1))
  stopifnot(all(nzchar(ids)), !anyDuplicated(ids))
}

cat("CV YAML counts and IDs passed\n")

source(file.path(repo_root, "cv", "R", "load-cv-data.R"))
cv <- load_cv_data(repo_root)

stopifnot(nrow(cv$publications) == 7L)
stopifnot(nrow(cv$presentations) == 9L)
stopifnot(nrow(cv$education) == 3L)
stopifnot(identical(
  names(education_entries(cv$education)),
  c("what", "with", "when", "where", "why")
))
stopifnot(identical(
  names(publication_entries(cv$publications)),
  c("what", "with", "when", "where", "why")
))
stopifnot(all(grepl(
  "^[0-9]{4}$|^Under review$",
  publication_entries(cv$publications)$when
)))
stopifnot(!anyDuplicated(cv$publications$id))
stopifnot(!anyDuplicated(cv$presentations$id))

cat("CV loader and entry mappings passed\n")

site_config <- read_yaml_file(file.path(repo_root, "_quarto.yml"))
stopifnot("cv/academic-cv.qmd" %in% unlist(site_config$project$render))

cat("CV website render target passed\n")
