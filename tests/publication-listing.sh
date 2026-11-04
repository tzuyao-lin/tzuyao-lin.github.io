#!/usr/bin/env bash
# Checks the rendered Research page against data/publications.yml and
# data/presentations.yml.
#
# By default the page is rendered in an isolated copy of the repo so a local
# run never touches docs/. Set SITE_DIR to the output of an existing
# `quarto render` (CI passes docs/) to skip the extra render.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
publications_yml="$repo_root/data/publications.yml"
presentations_yml="$repo_root/data/presentations.yml"

fail() {
  echo "FAIL: $1"
  exit 1
}

if [[ -n "${SITE_DIR:-}" ]]; then
  site="$(cd "$SITE_DIR" && pwd)"
else
  test_root="$(mktemp -d "${TMPDIR:-/tmp}/tzuyaolin-publication-listing.XXXXXX")"
  trap 'rm -rf "$test_root"' EXIT
  log="$test_root.log"

  rsync -a --exclude='.git' --exclude='docs' "$repo_root/" "$test_root/"
  if ! (cd "$test_root" && quarto render publication.qmd >"$log" 2>&1); then
    sed -n "1,120p" "$log"
    fail "isolated publication render failed"
  fi
  site="$test_root/docs"
fi

page="$site/publication.html"
site_css="$site/styles.css"
publication_css="$site/assets/css/publication.css"

for file in "$page" "$site_css" "$publication_css" "$site/assets/js/publication.js"; do
  [[ -f "$file" ]] || fail "rendered output is missing $file"
done

# XPath helpers. cls NAME expands to a class-token test.
cls() { echo "contains(concat(' ', normalize-space(@class), ' '), ' $1 ')"; }
xcount() { xmllint --html --xpath "count($1)" "$page" 2>/dev/null || true; }
xstring() { xmllint --html --xpath "normalize-space(string($1))" "$page" 2>/dev/null || true; }

# Match a pattern across lines (CSS rules span several lines).
css_has() { perl -0777 -ne "exit(/$1/ ? 0 : 1)" "$2"; }

expect_count() { # description, xpath, expected
  local got
  got="$(xcount "$2")"
  [[ "$got" == "$3" ]] || fail "$1: expected $3, got $got"
}

yaml_entries() { grep -c '^- id:' "$1" || true; }
yaml_field_count() { grep -c "^  $2:" "$1" || true; }

publication_total="$(yaml_entries "$publications_yml")"
presentation_total="$(yaml_entries "$presentations_yml")"
(( publication_total > 0 && presentation_total > 0 )) || fail "YAML data files are empty"

# Page structure.
expect_count "Research should be the single page title" \
  "//h1[$(cls title)][normalize-space(.)='Research']" 1
expect_count "Publications should be one second-level heading" \
  "//h2[normalize-space(.)='Publications']" 1
expect_count "Presentations should be one second-level heading" \
  "//h2[normalize-space(.)='Presentations']" 1
expect_count "Research should appear once in the site navigation" \
  "//a[$(cls nav-link)]//span[$(cls menu-text)][normalize-space(.)='Research']" 1
[[ -n "$(xstring "(//*[$(cls page-intro)])[1]")" ]] || fail "research intro is missing"

# One entry per YAML record, each with the pieces a reader relies on.
entry="//div[$(cls publication-entry)][not($(cls presentation-entry))]"
expect_count "publication entries" "$entry" "$publication_total"
expect_count "entries without a visible title" \
  "$entry[not(.//h3[$(cls publication-title)])]" 0
expect_count "entries without a BibTeX copy control" \
  "$entry[not(.//button[$(cls publication-citation-button)][span[normalize-space(.)='BibTeX']])]" 0
expect_count "entries without an APA copy control" \
  "$entry[not(.//button[$(cls publication-citation-button)][span[normalize-space(.)='APA']])]" 0
expect_count "entries without a highlighted self author" \
  "$entry[not(.//p[$(cls publication-authors)]//strong[$(cls publication-self)][normalize-space(.)='Lin, T.-Y.'])]" 0
expect_count "entries without venue and actions in one metadata row" \
  "$entry[not(.//div[$(cls publication-meta-row)][p[$(cls publication-venue)] and div[$(cls publication-actions)]])]" 0
expect_count "publication year labels" "//div[$(cls publication-entry-year)][not($(cls presentation-entry-date))]" "$publication_total"

# Counts that follow the YAML fields.
under_review="$(grep -c '^  status: under-review' "$publications_yml" || true)"
expect_count "entries labelled sentence-case 'Under review'" \
  "//div[$(cls publication-entry-year)][not($(cls presentation-entry-date))][normalize-space(.)='Under review']" "$under_review"
expect_count "DOI links" "//a[$(cls publication-link-doi)]" \
  "$(yaml_field_count "$publications_yml" doi)"
expect_count "preprint links" "//a[$(cls publication-link-preprint)]" \
  "$(yaml_field_count "$publications_yml" preprint)"
expect_count "related post links" "//a[$(cls publication-link-post)]" \
  "$(yaml_field_count "$publications_yml" post)"
expect_count "abstract controls" \
  "//div[$(cls publication-actions)]/button[$(cls publication-abstract-toggle)][@aria-expanded='false'][@aria-controls]" \
  "$(yaml_field_count "$publications_yml" abstract)"
expect_count "independent abstract panels" \
  "//div[$(cls publication-entry-body)]/div[$(cls publication-abstract-panel)][@hidden][@id]" \
  "$(yaml_field_count "$publications_yml" abstract)"
expect_count "related post links that are not the final action" \
  "//div[$(cls publication-actions)][.//a[$(cls publication-link-post)]][not(*[last()][self::a[$(cls publication-link-post)] or self::p[a[$(cls publication-link-post)]]])]" 0

# Every abstract control must point at a panel that exists.
while IFS= read -r panel_id; do
  [[ -n "$panel_id" ]] || continue
  expect_count "abstract panel #$panel_id" "//div[$(cls publication-abstract-panel)][@id='$panel_id']" 1
done < <(xmllint --html --xpath "//button[$(cls publication-abstract-toggle)]/@aria-controls" "$page" 2>/dev/null \
  | grep -oE 'aria-controls="[^"]+"' | sed -E 's/aria-controls="([^"]+)"/\1/')

# Author lists keep the YAML text, in YAML order.
index=0
while IFS= read -r authors; do
  index=$((index + 1))
  rendered="$(xstring "($entry//p[$(cls publication-authors)])[$index]")"
  [[ "$rendered" == "$authors" ]] || \
    fail "authors of publication $index render as '$rendered', expected '$authors'"
done < <(grep '^  authors:' "$publications_yml" | sed -E 's/^  authors: "?([^"]*)"?$/\1/')

# Layout rules that keep the list flat and aligned.
expect_count "details-based abstracts" "//details[$(cls publication-abstract)]" 0
expect_count "every publication action should use the shared action style" \
  "//div[$(cls publication-actions)]//*[self::a or self::button][not($(cls publication-action))]" 0
expect_count "publication actions should place their icon first" \
  "//div[$(cls publication-actions)]//*[self::a or self::button][not(*[1][self::i or (self::span and $(cls publication-abstract-symbol))])]" 0
if grep -Eq 'publication-year-group|publication-year-heading|publication-card' "$page"; then
  fail "publication output should be a flat list without year groups or cards"
fi

css_has 'main\.content h2\s*\{[^}]*border-bottom:\s*(0|none)' "$site_css" || \
  fail "second-level headings should remove the theme border consistently"
if css_has 'main\.content > h2\s*\{[^}]*border-(top|bottom):' "$publication_css"; then
  fail "section headings should not use decorative border lines"
fi
css_has '\.publication-actions > p\s*\{[^}]*display:\s*contents' "$publication_css" || \
  fail "Pandoc-generated paragraphs inside action rows must be flattened for vertical alignment"

grep -Fq 'href="assets/css/publication.css"' "$page" || fail "publication stylesheet is not loaded"
grep -Fq 'src="assets/js/publication.js"' "$page" || fail "publication interaction script is not loaded"

# Presentations: one entry per record, newest first, with YAML dates and places.
expect_count "presentation entries" "//div[$(cls presentation-entry)]" "$presentation_total"
expect_count "presentations without their type in the action row" \
  "//div[$(cls presentation-entry)][not(.//div[$(cls presentation-actions)]//*[$(cls presentation-type)])]" 0
expect_count "presentations without a slide link or placeholder" \
  "//div[$(cls presentation-entry)][not(.//a[$(cls presentation-link-slides)] or .//span[$(cls presentation-slides-placeholder)][normalize-space(.)='Slides forthcoming'])]" 0

format_date() {
  awk -F- 'BEGIN { split("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec", m, " ") }
           { printf "%s %d, %d\n", m[$2 + 0], $3, $1 }'
}

index=0
while IFS= read -r expected; do
  index=$((index + 1))
  rendered="$(xstring "(//div[$(cls presentation-entry)]/div[$(cls presentation-entry-date)])[$index]")"
  [[ "$rendered" == "$expected" ]] || \
    fail "presentation $index should be dated $expected (newest first), got: $rendered"
done < <(grep '^  date:' "$presentations_yml" | awk '{print $2}' | sort -r | format_date)

while IFS= read -r location; do
  grep -Fq "$location" "$page" || fail "presentation location '$location' is missing"
done < <(grep '^  location:' "$presentations_yml" | sed -E 's/^  location: "?([^"]*)"?$/\1/')

echo "PASS: publication list renders with citation controls and related links"
