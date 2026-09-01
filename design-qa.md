# Homepage Hero Design QA

- Original design reference: `/var/folders/kx/g_9_dx8j7t77zp9y81fkc7440000gn/T/codex-clipboard-dc388174-be3e-458e-a50d-1f50ff545dbe.png`
- Edge-defect reference: `/var/folders/kx/g_9_dx8j7t77zp9y81fkc7440000gn/T/codex-clipboard-c5d50bf8-b0d8-4d69-b877-1a5345744a20.png`
- Before screenshot: `/private/tmp/tzuyaolin-home-qa/edge-before-short.png`
- Implementation screenshot: `/private/tmp/tzuyaolin-home-qa/dense-nodes-reference-size.png`
- Combined comparison: `/private/tmp/tzuyaolin-dense-nodes-qa.svg.png`
- Viewport: 1672 × 941 CSS px, light theme, device-density-normalized 1× screenshot
- Additional evidence: `/private/tmp/tzuyaolin-home-qa/dense-nodes-light.png`, `/private/tmp/tzuyaolin-home-qa/dense-nodes-dark.png`, `/private/tmp/tzuyaolin-home-qa/dense-nodes-mobile.png`, and `/private/tmp/tzuyaolin-home-qa/dense-nodes-hover.png`

## Full-view comparison

The approved Hero composition, typography, navbar, copy, calls to action, and trajectory illustration remain unchanged. The overlay now contains 34 small nodes distributed across several trajectory bands, with roughly two-thirds teal and one-third amber. The existing vertical feather still blends the illustration and canvas into the page background.

## Focused-region comparison

The user-requested denser sparkle field is visible across the full longitudinal sequence rather than being concentrated in a few blue points. Amber nodes remain amber in both light and dark themes, while theme-specific luminance keeps them legible without dominating the headline. Pointer proximity increases local glow; without interaction, the same nodes retain their slow drift and pulse. Mobile and desktop captures preserve readable content and show no horizontal overflow.

## Required fidelity surfaces

- Fonts and typography: unchanged from the approved implementation.
- Spacing and layout rhythm: unchanged; the mask does not affect element geometry.
- Colors and visual tokens: the illustration remains restrained; overlay nodes now use teal and gold-orange theme-aware palettes.
- Image quality and asset fidelity: the supplied trajectory PNG remains the sole illustration. Its existing radial mask is retained, with a separate vertical feather applied to the whole visual layer.
- Copy and content: unchanged.

## Findings

No actionable P0, P1, or P2 findings remain within the requested node-density and two-color scope.

## Comparison history

- Pass 1: originally marked passed at a tall desktop viewport. This missed the upper PNG boundary exposed by a shorter Brave viewport.
- User review: P2 image-quality issue identified at the upper trajectory edge; the lower edge had the same structural risk.
- Pass 2: added a symmetric vertical alpha feather to the visual container. The matched short desktop comparison no longer shows a hard horizontal start; tall desktop, mobile, and dark-theme checks also pass.
- User review: requested more sparkling points across the dense sequence and a gold-orange accent in both themes.
- Pass 3: expanded the overlay from 16 to 34 distributed nodes, assigned a two-teal-to-one-amber palette, and verified light, dark, mobile, idle, and pointer-hover states.

## Interaction and browser checks

- Ambient node animation and pointer-proximity behavior remain active across all 34 nodes.
- Light desktop, reference-size desktop, mobile, dark-theme, and pointer-hover states were inspected.
- Computed vertical mask is active in the fresh-origin browser check.
- Horizontal overflow: 0 px on desktop and mobile checks.

## Follow-up polish

- P3: node density and the teal-to-amber ratio can be tuned after subjective review without changing layout or interaction logic.

final result: passed

---

# Publication List Design QA

- Source visual truth: browser annotation screenshots attached to the current task, captured at 884 × 863 CSS px
- Earlier implementation capture: `/private/tmp/tzuyaolin-publication-feedback-top.png`
- Final publication capture: `/private/tmp/tzuyaolin-publication-final-884.png`
- Final middle-list capture: `/private/tmp/tzuyaolin-publication-simplified-middle-light.png`
- Shared-scale captures: `/private/tmp/tzuyaolin-about-shared-scale-884.png` and `/private/tmp/tzuyaolin-posts-shared-scale-884.png`
- Current preview URL: `http://127.0.0.1:8765/publication.html`
- Viewport and density: source and final implementation are 884 × 863 pixels at an 884 × 863 CSS viewport, normalized 1× density
- State: light theme; publication top and middle-list scroll positions; About and Posts top positions

## Intended adaptation

The Kenny Yu page was used only as a functional reference for publication metadata and citation actions. The implementation intentionally omits cards, year sections, publication counts, search, and filters. The selected layout is a flat academic list with a narrow year column, restrained dividers, and one compact action row per publication.

## Full-view comparison

The final capture keeps the flat academic list, restrained separators, and a consistent two-column rhythm without cards or year sections. `Under review` and numeric years now use the same size, weight, and line height. About, Posts, and Publications use the same page-title and lead-text scale; the three visible post rows also have equal height and spacing.

## Focused-region comparison

- Action rows: all 23 controls begin with an icon, use a 0.95rem label, and share the same 29.75 px rendered height. Every control within each row has an identical top coordinate, including both `Related post` links.
- Status and year: `Under review` and `2026` both compute to 16.15 px, weight 650, and 24.225 px line height at the review viewport.
- Shared hierarchy: About, Posts, and Publications H1 headings all compute to 35.36 px; page leads/subtitles compute to 19.55 px. Publication and post titles share the same 18.7 px scale.
- Content: ampersands render correctly; every `Lin, T.-Y.` occurrence is highlighted; the coffee paper and tutorial contain the requested related-post and PsyArXiv links.

## Required fidelity surfaces

- Fonts and typography: a small shared type scale in `styles.css` now governs base, small, lead, and listing text. Publication-specific labels and controls use the same 0.95rem size instead of four competing small sizes.
- Spacing and layout rhythm: the auto-generated action paragraph uses `display: contents`, allowing one parent flex row to align links and buttons. Post rows at 884 px are each 186.09 px high; publication entries retain content-dependent height with identical outer padding.
- Colors and visual tokens: the existing muted foreground and teal accent are reused; no new color was introduced.
- Image quality and asset fidelity: the page contains no publication imagery; the existing Bootstrap icon font remains the only icon source.
- Copy and content: ampersands render correctly, two related posts are present, the PsyArXiv link is labeled `Preprint`, and the review label uses sentence case.

## Visual findings

- No actionable P0, P1, or P2 findings remain within the annotated typography, alignment, spacing, and simplification scope.
- P3: About uses Quarto's Solana template, so its content composition remains intentionally different from the listing pages even though the typography scale is shared.

## Comparison history

- Pass 1: the initial card implementation was rejected because EJS output was parsed as code inside custom HTML elements.
- Pass 2: switching to Quarto-compatible `div` wrappers fixed the content structure, but an invisible listing-metadata paragraph occupied the first CSS-grid cell.
- Pass 3: listing metadata was moved into a hidden container, leaving year and publication body as the two visible grid cells.
- User review: six annotations identified action underlines and spacing, incorrect ampersand display, missing self-author emphasis, missing related-post and preprint links, and related-post ordering.
- Pass 4: removed action underlines, standardized the flex gap, highlighted the self author, corrected author encoding, added both requested links, and placed related posts last. The revised 747 × 863 browser captures show the fixes at the same viewport as the annotations.
- User review: the next 884 × 863 annotations identified uneven action baselines, inconsistent icon order, an undersized year label, and inconsistent type and spacing across About, Posts, and Publications.
- Pass 5: removed unused hidden listing metadata and the old template attribution file, made all icons leading, unified small text at 0.95rem, and moved the action flex layout to the true common parent. The first browser check found Quarto's generated paragraph still acting as a separate flex item.
- Pass 6: changed the generated action paragraph to `display: contents`, widened the year column to keep `Under review` on one line, and centralized the cross-page title, lead, listing-title, and metadata scales. The final 884 × 863 captures show aligned action rows, matching year/status typography, equal post-row spacing, and no horizontal overflow.

## Interaction and browser checks

- Abstract disclosure opens and changes its label to `Hide abstract`.
- Browser DOM confirms all 23 action controls use a leading icon; each action row has identical control top and height values.
- Browser DOM confirms seven self-author highlights, one PsyArXiv link, two related-post links, and both related-post links in the last position.
- About, Posts, and Publications were checked at 884 × 863 in light theme; all report zero horizontal overflow.
- Primary interactions tested: abstract disclosure and both citation-copy formats (unit test).
- Browser console warnings and errors: none.
- Citation-copy data and success/failure behavior pass the Node unit test.

final result: passed
