# Power Rush — Item inspection landing

New route: `/equipar`. The existing home, PDP, cart.js and checkout remain unchanged.

## Design and behavior

- Two official product models presented as inspectable inventory items. Shared formula is explicit before selection.
- Five scroll chapters: front, label benefits, nutrition panel, preparation panel, open container.
- Flavor changes preserve the current chapter. Users can drag or use arrow keys/rotation buttons; chapter navigation also works by keyboard.
- Most of each chapter holds its calibrated label angle; the last 26% rotates to the next stop. Label angles were calculated from the official Cherry GLB UV/normal data and visually checked.
- Official closed GLBs are shared with the existing home. Open GLBs were exported from `pote_abierto.blend` in the user-provided Drive (file ID `193yDAnIJbwcxI9kFMIIkblDHSttXokir`). Original meshes, labels, powder, scoops and loose lids are retained. No generated product artwork.
- Open assets load near chapter four. Static product renders display before WebGL loads, on failure and in reduced-motion/pause mode. Open WebP posters were rendered from the same Blender source. The missing external world HDRI was not used; original area lights render the product.
- WebGL rendering is capped at approximately 30fps, DPR 1.5, and suspended outside the viewport/hidden document.
- No fabricated scores or ingredient claims. Formula is exactly the supplied brief.

## Commerce

Loads unchanged `/cart.js`. Prices, stock and all cart writes use `PowerCart`. Quantity selector supports one, two or three containers, including mixed flavors. The quote accounts for existing cart quantity; checkout remains authoritative. Limited stock responses are reported accurately after adding. No checkout was submitted during QA.

## Copy sources and deliberate decisions

- Founder and FAQ copied from the current `index.html` at commit `690c938`. Only the net-weight clause in the first FAQ was removed to satisfy the supplied brief's explicit prohibition on displaying net grams in page copy. Original product label art remains unmodified and includes its printed net weight.
- The current home contains no written reviews, so the three review quotations were copied verbatim from the original repository home at commit `772322`. Their authenticity was not independently verified; no additional review counts or scores were introduced.
- Kept the existing setup image beside the founder copy rather than implying it is a founder portrait.
- Added direct chapter navigation, pause control, keyboard rotation, mixed-bundle selection and separate rewards section.
- New route is a comparison candidate, not an active randomized A/B test. Traffic allocation and conversion attribution are not configured.

## Verification

- Desktop 1440×900 and mobile 390×844 / 320×740 visual checks.
- Verified front, benefits and nutrition label alignment, both open models, and flavor changes via a real coordinate click preserving scroll position/chapter. Browser locator clicks may themselves scroll sticky controls into view; physical pointer clicks do not.
- Purchased nothing. Added one of each flavor to the existing cart: correct two-container discount/free shipping, then removed both test items.
- Pause mode shows static closed/open renders; open posterior image load checked.
- Syntax checks, HTML-referenced local assets and unchanged baseline files checked before publication.

## Remaining limitations

- Real reduced-motion OS setting and WebGL-disabled hardware were not directly emulated; the shared pause/static branch was exercised.
- No real checkout, payment or conversion experiment has been run.
