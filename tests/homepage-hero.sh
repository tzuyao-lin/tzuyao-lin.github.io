#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d /private/tmp/tzuyaolin-site-smoke.XXXXXX)"
render_log="$test_root/quarto-render.log"
trap 'rm -rf "$test_root"' EXIT

rsync -a \
  --exclude='.git' \
  --exclude='.quarto' \
  --exclude='_site' \
  --exclude='docs' \
  "$repo_root/" "$test_root/"

if ! (
  cd "$test_root"
  node --test tests/home-particles.test.mjs

  for source in index.qmd about.qmd blog.qmd publication.qmd; do
    quarto render "$source" >>"$render_log" 2>&1
  done
); then
  sed -n '1,120p' "$render_log" 2>/dev/null || true
  exit 1
fi

page="$test_root/docs/index.html"
about_page="$test_root/docs/about.html"

assert_contains() {
  local pattern="$1"
  local message="$2"

  if ! rg -q --fixed-strings "$pattern" "$page"; then
    echo "FAIL: $message"
    exit 1
  fi
}

assert_absent() {
  local pattern="$1"
  local message="$2"

  if rg -q --fixed-strings "$pattern" "$page"; then
    echo "FAIL: $message"
    exit 1
  fi
}

assert_matches() {
  local pattern="$1"
  local message="$2"

  if ! rg -q "$pattern" "$page"; then
    echo "FAIL: $message"
    exit 1
  fi
}

assert_about_contains() {
  local pattern="$1"
  local message="$2"

  if ! rg -q --fixed-strings "$pattern" "$about_page"; then
    echo "FAIL: $message"
    exit 1
  fi
}

assert_about_absent() {
  local pattern="$1"
  local message="$2"

  if rg -q --fixed-strings "$pattern" "$about_page"; then
    echo "FAIL: $message"
    exit 1
  fi
}

assert_contains 'class="home-hero"' "rendered homepage is missing the custom Hero"
assert_contains "Hi, I'm Tzu-Yao." "Hero heading does not use the approved wording"
assert_contains 'I study <span class="gradient-text">reliability</span>' "Hero research statement is missing"
assert_contains 'Joint PhD candidate' "Hero affiliation is missing"
assert_matches '<a class="hero-button hero-button-primary" href="(\./)?publication\.html">' "publications call-to-action does not target the rendered publications page"
assert_contains 'href="https://xup6y3ul6.github.io/CV/TzuYaoLin_CV.pdf"' "CV call-to-action is missing"
assert_contains 'src="assets/images/home-trajectory.png"' "dense trajectory background asset is missing"
assert_contains 'href="assets/css/home.css"' "homepage-specific stylesheet is not loaded"
assert_contains 'src="assets/js/home.js"' "cursor glow script is not loaded"
assert_contains '<span class="menu-text">About Me</span>' "About Me is missing from the navbar"
assert_absent 'A · DATA CONSTELLATION' "concept label must not appear on the published homepage"
assert_absent 'class="home-about' "About content must not remain on the cover-only homepage"
assert_absent 'class="home-section research-section' "Research section must not remain on the cover-only homepage"
assert_absent 'class="home-section background-section' "Background section must not remain on the cover-only homepage"
assert_absent 'profile-2024.jpg' "portrait belongs on About Me, not the homepage Hero"

assert_about_contains 'quarto-about-solana' "About Me did not restore the original Solana layout"
assert_about_contains 'src="assets/images/profile-2024.jpg"' "About Me is missing the original portrait"
assert_about_contains 'Research focus' "About Me is missing the original research section"
assert_about_contains 'Background' "About Me is missing the original background section"
assert_about_contains '<span class="menu-text">About Me</span>' "About Me navbar entry is missing on the About page"
assert_about_contains '<i class="ai ai-orcid"></i> ORCID' "ORCID does not render as clean Academicons markup"
assert_about_contains 'class="bi bi-file-person-fill"' "CV icon is missing"
assert_about_contains 'class="bi bi-envelope-at-fill"' "Email icon is missing"
assert_about_contains 'class="bi bi-linkedin"' "LinkedIn icon is missing"
assert_about_contains 'href="https://orcid.org/0000-0002-2261-448X"' "ORCID link is missing"
assert_about_contains 'href="mailto:tzu-yao.lin@maastrichtuniversity.nl"' "Email link is missing"
assert_about_absent 'title=""' "Academicons emitted an empty title attribute"
assert_about_absent 'style="color:"' "Academicons emitted an empty color style"

if [[ -e "$test_root/docs/assets/orcid-id.svg" ]]; then
  echo "FAIL: obsolete ORCID image is still included in rendered output"
  exit 1
fi

if rg -q --fixed-strings 'tmp-academicon-inline-test.html' \
  "$test_root/docs/search.json" "$test_root/docs/sitemap.xml"; then
  echo "FAIL: temporary Academicons test page remains in generated site metadata"
  exit 1
fi

echo "PASS: homepage, Solana About Me, and profile icons render as designed"
