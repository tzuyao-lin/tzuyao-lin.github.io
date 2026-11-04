`%||%` <- function(x, y) if (is.null(x)) y else x

args <- commandArgs(trailingOnly = TRUE)
repo_root <- if (length(args)) args[[1]] else "."

read_yaml_file <- function(path) {
  if (!file.exists(path)) stop("Missing YAML file: ", path, call. = FALSE)
  yaml::read_yaml(path)
}

sections <- c("education", "awards", "research", "teaching", "reviewing", "skills")

# load_cv_data() below checks that the profile fields are present.
for (section in sections) {
  records <- read_yaml_file(
    file.path(repo_root, "data", "cv", paste0(section, ".yml"))
  )
  stopifnot(length(records) > 0L)
  ids <- vapply(records, function(x) x$id %||% "", character(1))
  stopifnot(all(nzchar(ids)), !anyDuplicated(ids))
}

cat("CV YAML IDs passed\n")

source(file.path(repo_root, "cv", "R", "load-cv-data.R"))
cv <- load_cv_data(repo_root)

stopifnot(nrow(cv$publications) > 0L, nrow(cv$presentations) > 0L)
stopifnot(nrow(cv$education) > 0L)
stopifnot(identical(
  names(education_entries(cv$education)),
  c("what", "with", "when", "where", "why")
))
stopifnot(identical(
  names(publication_entries(cv$publications)),
  c("what", "with", "when", "where", "why")
))
stopifnot(all(grepl(
  "^$|^[0-9]{4}$|^Under review$",
  publication_entries(cv$publications)$when
)))
stopifnot(!anyDuplicated(cv$publications$id))
stopifnot(!anyDuplicated(cv$presentations$id))

cat("CV loader and entry mappings passed\n")
