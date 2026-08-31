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
