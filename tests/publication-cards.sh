#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d /private/tmp/tzuyaolin-publication-cards.XXXXXX)"
trap 'rm -rf "$test_root"' EXIT

fail() {
  echo "FAIL: $1"
  exit 1
}

rsync -a \
  --exclude='.git' \
  --exclude='docs' \
  "$repo_root/" "$test_root/"

if ! (
  cd "$test_root"
  quarto render publication.qmd >/private/tmp/tzuyaolin-publication-cards-render.log 2>&1
); then
  sed -n '1,120p' /private/tmp/tzuyaolin-publication-cards-render.log
  fail "isolated publication render failed"
fi

page="$test_root/docs/publication.html"

[[ -f "$page" ]] || fail "publication page did not render"

entry_count="$(rg -o 'class="publication-entry"' "$page" 2>/dev/null | wc -l | tr -d ' ' || true)"
[[ "$entry_count" == "7" ]] || fail "expected 7 publication entries, got $entry_count"

title_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-entry ")]//h3[contains(concat(" ", normalize-space(@class), " "), " publication-title ")])' \
  "$page" 2>/dev/null || true)"
[[ "$title_count" == "7" ]] || \
  fail "expected each entry to contain a visible title, got $title_count"

rg -q 'class="publication-entry-year"' "$page" || \
  fail "publication year metadata is missing"
review_label="$(xmllint --html --xpath \
  'normalize-space(string((//div[contains(concat(" ", normalize-space(@class), " "), " publication-entry-year ")])[1]))' \
  "$page" 2>/dev/null || true)"
[[ "$review_label" == "Under review" ]] || \
  fail "expected the review status to use sentence case, got: $review_label"
if rg -q 'publication-year-group|publication-year-heading|publication-card' "$page"; then
  fail "publication output should be a flat list without year groups or cards"
fi

doi_count="$(rg -o 'class="publication-link publication-link-doi"' "$page" 2>/dev/null | wc -l | tr -d ' ' || true)"
[[ "$doi_count" == "6" ]] || fail "expected 6 DOI links, got $doi_count"

rg -q 'class="publication-citation-button"[^>]*data-citation-format="bibtex"' "$page" || \
  fail "BibTeX copy controls are missing"
rg -q 'class="publication-citation-button"[^>]*data-citation-format="apa"' "$page" || \
  fail "APA copy controls are missing"

self_highlight_count="$(xmllint --html --xpath \
  'count(//p[contains(concat(" ", normalize-space(@class), " "), " publication-authors ")]//strong[contains(concat(" ", normalize-space(@class), " "), " publication-self ")][normalize-space(.)="Lin, T.-Y."])' \
  "$page" 2>/dev/null || true)"
[[ "$self_highlight_count" == "7" ]] || \
  fail "expected Lin, T.-Y. to be highlighted in all 7 author lists, got $self_highlight_count"

first_author_text="$(xmllint --html --xpath \
  'normalize-space(string((//p[contains(concat(" ", normalize-space(@class), " "), " publication-authors ")])[1]))' \
  "$page" 2>/dev/null || true)"
[[ "$first_author_text" == "Lin, T.-Y., Tuerlinckx, F., & Vanbelle, S." ]] || \
  fail "author separators render incorrectly: $first_author_text"

metadata_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-listing-metadata ")])' \
  "$page" 2>/dev/null || true)"
[[ "$metadata_count" == "0" ]] || \
  fail "unused hidden listing metadata should not be rendered, got $metadata_count containers"

action_control_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-actions ")]//*[self::a or self::button])' \
  "$page" 2>/dev/null || true)"
leading_icon_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-actions ")]//*[self::a or self::button]/*[1][self::i])' \
  "$page" 2>/dev/null || true)"
[[ "$action_control_count" == "23" ]] || \
  fail "expected 23 publication action controls, got $action_control_count"
[[ "$leading_icon_count" == "$action_control_count" ]] || \
  fail "every publication action should place its icon first ($leading_icon_count/$action_control_count)"

preprint_count="$(rg -o 'class="publication-link publication-link-preprint"' "$page" 2>/dev/null | wc -l | tr -d ' ' || true)"
[[ "$preprint_count" == "1" ]] || fail "expected 1 PsyArXiv preprint link, got $preprint_count"
rg -q 'href="https://doi.org/10.31234/osf.io/2xs9k_v1"' "$page" || \
  fail "tutorial PsyArXiv DOI is missing"

post_count="$(rg -o 'class="publication-link publication-link-post"' "$page" 2>/dev/null | wc -l | tr -d ' ' || true)"
[[ "$post_count" == "2" ]] || fail "expected 2 related post links, got $post_count"
rg -q 'href="posts/20240918_CDP/"' "$page" || \
  fail "coffee and polygenic-risk related post is missing"

post_last_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-actions ")]//*[self::p or self::div]/*[last()][contains(concat(" ", normalize-space(@class), " "), " publication-link-post ")])' \
  "$page" 2>/dev/null || true)"
[[ "$post_last_count" == "2" ]] || \
  fail "related post links should be the final action, got $post_last_count"

rg -q 'class="publication-abstract"' "$page" || \
  fail "expandable abstract content is missing"
rg -q 'href="publication.css"' "$page" || \
  fail "publication stylesheet is not loaded"
rg -q 'src="publication.js"' "$page" || \
  fail "publication interaction script is not loaded"
rg -q 'IMPS 2026 Annual Meeting' "$page" || \
  fail "presentations should remain available below the cards"

echo "PASS: publication list renders with citation controls and related links"
