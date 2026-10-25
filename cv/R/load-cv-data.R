`%||%` <- function(x, y) if (is.null(x)) y else x

read_profile_file <- function(path) {
  if (!file.exists(path)) stop("Missing YAML file: ", path, call. = FALSE)
  profile <- yaml::read_yaml(path)
  required <- c("name", "surname", "position", "email")
  missing <- required[vapply(required, function(key) {
    value <- profile[[key]]
    is.null(value) || length(value) != 1L || is.na(value) || identical(value, "")
  }, logical(1))]
  if (length(missing)) {
    stop(path, " missing: ", paste(missing, collapse = ", "), call. = FALSE)
  }
  profile
}

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
      value <- record[[key]]
      is.null(value) || length(value) != 1L || is.na(value) || identical(value, "")
    }, logical(1))]
    if (length(missing)) {
      stop(
        path, " [", id, "] missing: ", paste(missing, collapse = ", "),
        call. = FALSE
      )
    }
  }

  result <- dplyr::bind_rows(records)
  if (anyDuplicated(result$id)) stop("Duplicate IDs in ", path, call. = FALSE)
  result
}

load_cv_data <- function(repo_root = "..") {
  cv_dir <- file.path(repo_root, "data", "cv")
  list(
    profile = read_profile_file(file.path(cv_dir, "profile.yml")),
    education = read_record_file(
      file.path(cv_dir, "education.yml"),
      c("id", "degree", "institution", "location", "start_date", "end_date")
    ),
    awards = read_record_file(
      file.path(cv_dir, "awards.yml"),
      c("id", "date", "organization", "details")
    ),
    research = read_record_file(
      file.path(cv_dir, "research.yml"),
      c("id", "role", "topic", "supervisor", "start_date", "end_date", "details")
    ),
    teaching = read_record_file(
      file.path(cv_dir, "teaching.yml"),
      c("id", "title", "institution", "semester")
    ),
    reviewing = read_record_file(
      file.path(cv_dir, "reviewing.yml"),
      c("id", "journal", "date")
    ),
    skills = read_record_file(
      file.path(cv_dir, "skills.yml"),
      c("id", "category", "skill")
    ),
    publications = read_record_file(
      file.path(repo_root, "data", "publications.yml"),
      c("id", "status", "authors", "title", "venue")
    ),
    presentations = read_record_file(
      file.path(repo_root, "data", "presentations.yml"),
      c("id", "date", "title", "venue", "location", "type")
    )
  )
}

as_text <- function(x, n) {
  if (is.null(x)) rep("", n) else ifelse(is.na(x), "", as.character(x))
}

span <- function(start, end) paste0(start, "--", end)

education_entries <- function(x) {
  dplyr::transmute(
    x,
    what = degree,
    with = institution,
    when = span(start_date, end_date),
    where = location,
    # Vitae wraps `why` in one \item; close and reopen it to get one bullet per line.
    why = gsub(
      "\n", "`}\\item {`{=latex}", as_text(details, dplyr::n()), fixed = TRUE
    )
  )
}

publication_entries <- function(x) {
  n <- nrow(x)
  year <- as_text(x$year, n)
  doi <- as_text(x$doi, n)
  preprint <- as_text(x$preprint, n)
  url <- ifelse(nzchar(doi), paste0("https://doi.org/", doi), preprint)
  title <- ifelse(nzchar(url), paste0("[", x$title, "](", url, ")"), x$title)
  tibble::tibble(
    what = gsub("Lin, T.-Y.", "**Lin, T.-Y.**", x$authors, fixed = TRUE),
    with = title,
    when = year,
    where = x$venue,
    why = ""
  )
}

presentation_entries <- function(x) {
  tibble::tibble(
    what = x$venue,
    with = x$title,
    when = format(as.Date(x$date), "%b %Y"),
    where = x$location,
    why = ifelse(x$type == "Oral presentation", "", x$type)
  )
}

award_entries <- function(x) {
  dplyr::transmute(
    x,
    what = organization,
    with = as_text(award, dplyr::n()),
    when = as.character(date),
    why = details
  )
}

research_entries <- function(x) {
  dplyr::transmute(
    x,
    what = role,
    with = topic,
    when = span(start_date, end_date),
    where = "Taipei, Taiwan",
    why = paste0(details, " Supervisors: ", supervisor, ".")
  )
}

teaching_entries <- function(x) {
  dplyr::transmute(
    x,
    what = institution,
    with = title,
    when = as.character(semester)
  )
}

reviewing_entries <- function(x) {
  dplyr::transmute(
    x,
    what = "Reviewer",
    with = journal,
    when = as.character(date)
  )
}

skill_entries <- function(x) {
  x |>
    dplyr::group_by(category) |>
    dplyr::summarise(what = paste(skill, collapse = ", "), .groups = "drop") |>
    dplyr::rename(with = category)
}
