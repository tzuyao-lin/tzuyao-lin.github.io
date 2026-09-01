#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d /private/tmp/tzuyaolin-publication-listing.XXXXXX)"
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
  quarto render publication.qmd >/private/tmp/tzuyaolin-publication-listing-render.log 2>&1
); then
  sed -n '1,120p' /private/tmp/tzuyaolin-publication-listing-render.log
  fail "isolated publication render failed"
fi

page="$test_root/docs/publication.html"

[[ -f "$page" ]] || fail "publication page did not render"

research_title_count="$(xmllint --html --xpath \
  'count(//h1[contains(concat(" ", normalize-space(@class), " "), " title ")][normalize-space(.)="Research"])' \
  "$page" 2>/dev/null || true)"
[[ "$research_title_count" == "1" ]] || \
  fail "expected Research as the single page title, got $research_title_count"

publication_heading_count="$(xmllint --html --xpath \
  'count(//h2[normalize-space(.)="Publications"])' \
  "$page" 2>/dev/null || true)"
presentation_heading_count="$(xmllint --html --xpath \
  'count(//h2[normalize-space(.)="Presentations"])' \
  "$page" 2>/dev/null || true)"
[[ "$publication_heading_count" == "1" ]] || \
  fail "expected Publications as one second-level heading, got $publication_heading_count"
[[ "$presentation_heading_count" == "1" ]] || \
  fail "expected Presentations as one second-level heading, got $presentation_heading_count"

research_intro="$(xmllint --html --xpath \
  'normalize-space(string((//*[contains(concat(" ", normalize-space(@class), " "), " page-intro ")])[1]))' \
  "$page" 2>/dev/null || true)"
[[ "$research_intro" == "Peer-reviewed work, manuscripts under review, and conference presentations." ]] || \
  fail "research intro is missing or incorrect: $research_intro"

research_nav_count="$(xmllint --html --xpath \
  'count(//a[contains(concat(" ", normalize-space(@class), " "), " nav-link ")]//span[contains(concat(" ", normalize-space(@class), " "), " menu-text ")][normalize-space(.)="Research"])' \
  "$page" 2>/dev/null || true)"
[[ "$research_nav_count" == "1" ]] || \
  fail "expected Research in the site navigation, got $research_nav_count"

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

doi_count="$(xmllint --html --xpath \
  'count(//a[contains(concat(" ", normalize-space(@class), " "), " publication-link-doi ")])' \
  "$page" 2>/dev/null || true)"
[[ "$doi_count" == "6" ]] || fail "expected 6 DOI links, got $doi_count"

bibtex_count="$(xmllint --html --xpath \
  'count(//button[contains(concat(" ", normalize-space(@class), " "), " publication-citation-button ")][span[normalize-space(.)="BibTeX"]])' \
  "$page" 2>/dev/null || true)"
apa_count="$(xmllint --html --xpath \
  'count(//button[contains(concat(" ", normalize-space(@class), " "), " publication-citation-button ")][span[normalize-space(.)="APA"]])' \
  "$page" 2>/dev/null || true)"
[[ "$bibtex_count" == "$entry_count" ]] || \
  fail "each publication should have one BibTeX copy control ($bibtex_count/$entry_count)"
[[ "$apa_count" == "$entry_count" ]] || \
  fail "each publication should have one APA copy control ($apa_count/$entry_count)"

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

inline_metadata_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-meta-row ")][p[contains(concat(" ", normalize-space(@class), " "), " publication-venue ")] and div[contains(concat(" ", normalize-space(@class), " "), " publication-actions ")]])' \
  "$page" 2>/dev/null || true)"
[[ "$inline_metadata_count" == "7" ]] || \
  fail "expected venue and actions in one metadata row for all 7 publications, got $inline_metadata_count"

metadata_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-listing-metadata ")])' \
  "$page" 2>/dev/null || true)"
[[ "$metadata_count" == "0" ]] || \
  fail "unused hidden listing metadata should not be rendered, got $metadata_count containers"

action_control_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-actions ")]//*[self::a or self::button])' \
  "$page" 2>/dev/null || true)"
leading_icon_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-actions ")]//*[self::a or self::button]/*[1][self::i or (self::span and contains(concat(" ", normalize-space(@class), " "), " publication-abstract-symbol "))])' \
  "$page" 2>/dev/null || true)"
shared_action_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-actions ")]//*[self::a or self::button][contains(concat(" ", normalize-space(@class), " "), " publication-action ")])' \
  "$page" 2>/dev/null || true)"
(( action_control_count > 0 )) || fail "publication action controls are missing"
[[ "$shared_action_count" == "$action_control_count" ]] || \
  fail "every interactive publication control should use the shared action style ($shared_action_count/$action_control_count)"
[[ "$leading_icon_count" == "$action_control_count" ]] || \
  fail "every publication action should place its icon first ($leading_icon_count/$action_control_count)"

generic_link_class_count="$(xmllint --html --xpath \
  'count(//*[contains(concat(" ", normalize-space(@class), " "), " publication-link ")])' \
  "$page" 2>/dev/null || true)"
[[ "$generic_link_class_count" == "0" ]] || \
  fail "publication actions should not retain the unused generic link class, got $generic_link_class_count"

citation_format_attribute_count="$(xmllint --html --xpath \
  'count(//button[contains(concat(" ", normalize-space(@class), " "), " publication-citation-button ")][@data-citation-format])' \
  "$page" 2>/dev/null || true)"
[[ "$citation_format_attribute_count" == "0" ]] || \
  fail "citation buttons should derive their labels from visible text, not a redundant data attribute"

preprint_count="$(xmllint --html --xpath \
  'count(//a[contains(concat(" ", normalize-space(@class), " "), " publication-link-preprint ")])' \
  "$page" 2>/dev/null || true)"
[[ "$preprint_count" == "1" ]] || fail "expected 1 PsyArXiv preprint link, got $preprint_count"
rg -q 'href="https://doi.org/10.31234/osf.io/2xs9k_v1"' "$page" || \
  fail "tutorial PsyArXiv DOI is missing"

post_count="$(xmllint --html --xpath \
  'count(//a[contains(concat(" ", normalize-space(@class), " "), " publication-link-post ")])' \
  "$page" 2>/dev/null || true)"
[[ "$post_count" == "2" ]] || fail "expected 2 related post links, got $post_count"
rg -q 'href="posts/20240918_CDP/"' "$page" || \
  fail "coffee and polygenic-risk related post is missing"

post_last_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-actions ")][.//a[contains(concat(" ", normalize-space(@class), " "), " publication-link-post ")]]/*[last()][self::a[contains(concat(" ", normalize-space(@class), " "), " publication-link-post ")] or self::p[a[contains(concat(" ", normalize-space(@class), " "), " publication-link-post ")]]])' \
  "$page" 2>/dev/null || true)"
[[ "$post_last_count" == "2" ]] || \
  fail "related post links should be the final action, got $post_last_count"

inline_abstract_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-actions ")]/button[contains(concat(" ", normalize-space(@class), " "), " publication-abstract-toggle ")][@aria-expanded="false"][@aria-controls])' \
  "$page" 2>/dev/null || true)"
[[ "$inline_abstract_count" == "6" ]] || \
  fail "expected all 6 abstract controls in the publication action row, got $inline_abstract_count"

abstract_panel_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " publication-entry-body ")]/div[contains(concat(" ", normalize-space(@class), " "), " publication-abstract-panel ")][@hidden][@id])' \
  "$page" 2>/dev/null || true)"
[[ "$abstract_panel_count" == "6" ]] || \
  fail "expected 6 independent abstract panels below the metadata row, got $abstract_panel_count"

details_abstract_count="$(xmllint --html --xpath \
  'count(//details[contains(concat(" ", normalize-space(@class), " "), " publication-abstract ")])' \
  "$page" 2>/dev/null || true)"
[[ "$details_abstract_count" == "0" ]] || \
  fail "abstract controls should not use layout-shifting details elements, got $details_abstract_count"

rg -q 'href="assets/css/publication.css"' "$page" || \
  fail "publication stylesheet is not loaded"

if ! rg -U -q '\.publication-actions > p[[:space:]]*\{[^}]*display:[[:space:]]*contents' \
  "$test_root/docs/assets/css/publication.css"; then
  fail "Pandoc-generated paragraphs inside action rows must be flattened for vertical alignment"
fi

rg -q 'src="assets/js/publication.js"' "$page" || \
  fail "publication interaction script is not loaded"
rg -q 'IMPS 2026 Annual Meeting' "$page" || \
  fail "presentations should remain available below the publication list"

presentation_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " presentation-entry ")])' \
  "$page" 2>/dev/null || true)"
[[ "$presentation_count" == "9" ]] || \
  fail "expected 9 structured presentation entries, got $presentation_count"

slides_placeholder_count="$(xmllint --html --xpath \
  'count(//span[contains(concat(" ", normalize-space(@class), " "), " presentation-slides-placeholder ")][normalize-space(.)="Slides forthcoming"])' \
  "$page" 2>/dev/null || true)"
slides_link_count="$(xmllint --html --xpath \
  'count(//a[contains(concat(" ", normalize-space(@class), " "), " presentation-link-slides ")])' \
  "$page" 2>/dev/null || true)"
slides_state_count="$((slides_placeholder_count + slides_link_count))"
[[ "$slides_state_count" == "$presentation_count" ]] || \
  fail "each presentation should expose either a slide link or placeholder ($slides_state_count/$presentation_count)"

expected_dates=(
  "Jul 21, 2026"
  "Dec 5, 2025"
  "Sep 30, 2025"
  "Jul 19, 2024"
  "Mar 12, 2024"
  "Nov 23, 2023"
  "Jul 21, 2023"
  "Jul 13, 2023"
  "Jun 20, 2023"
)

for index in "${!expected_dates[@]}"; do
  xpath_index="$((index + 1))"
  rendered_date="$(xmllint --html --xpath \
    "normalize-space(string((//div[contains(concat(' ', normalize-space(@class), ' '), ' presentation-entry ')]/div[contains(concat(' ', normalize-space(@class), ' '), ' presentation-entry-date ')])[${xpath_index}]))" \
    "$page" 2>/dev/null || true)"
  [[ "$rendered_date" == "${expected_dates[$index]}" ]] || \
    fail "presentation $xpath_index should be dated ${expected_dates[$index]}, got: $rendered_date"
done

inline_presentation_meta_count="$(xmllint --html --xpath \
  'count(//div[contains(concat(" ", normalize-space(@class), " "), " presentation-actions ")]//*[contains(concat(" ", normalize-space(@class), " "), " presentation-type ")])' \
  "$page" 2>/dev/null || true)"
[[ "$inline_presentation_meta_count" == "9" ]] || \
  fail "expected presentation type and slides on the same row for all 9 entries, got $inline_presentation_meta_count"

rg -q 'Yonsei University, Seoul, South Korea' "$page" || \
  fail "IMPS 2026 venue should identify Yonsei University"
rg -q 'University of Amsterdam, Roeterseiland campus' "$page" || \
  fail "MathPsych 2023 venue should identify the University of Amsterdam campus"
rg -q 'Prague University of Economics and Business' "$page" || \
  fail "IMPS 2024 venue should identify the verified host university"
rg -q 'Ghent University, Campus Dunant' "$page" || \
  fail "EAM 2023 venue should identify the verified campus"

echo "PASS: publication list renders with citation controls and related links"
