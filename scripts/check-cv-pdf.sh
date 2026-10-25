#!/usr/bin/env bash
# Fail when cv/TzuYaoLin_CV.pdf no longer matches a fresh render of the CV.
# The PDF footer embeds the render date, so compare extracted text with the
# date line removed instead of comparing bytes.

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
work="$(mktemp -d "${TMPDIR:-/tmp}/tzuyaolin-cv-check.XXXXXX")"

pdf_text() {
  pdftotext -layout "$1" - | grep -Ev '^[[:space:]]*[0-9]{4}.[0-9]{2}.[0-9]{2}[[:space:]]' | sed 's/[[:space:]]\+/ /g'
}

# quarto writes the PDF next to the source, so set the tracked copy aside and
# put it back afterwards.
tracked="$repo_root/cv/TzuYaoLin_CV.pdf"
cp "$tracked" "$work/tracked.pdf"
trap 'cp "$work/tracked.pdf" "$tracked"; rm -rf "$work"' EXIT

(cd "$repo_root" && quarto render cv/academic-cv.qmd)

pdf_text "$tracked" >"$work/fresh.txt"
pdf_text "$work/tracked.pdf" >"$work/tracked.txt"

if ! diff -u "$work/tracked.txt" "$work/fresh.txt"; then
  echo "FAIL: cv/TzuYaoLin_CV.pdf is stale." >&2
  echo "Run 'quarto render cv/academic-cv.qmd' and commit the new PDF." >&2
  exit 1
fi
echo "OK: tracked CV PDF matches a fresh render."
