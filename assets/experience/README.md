# Power Rush — Your next game starts here

A new home page grounded in the existing PDP: near-black backgrounds, #00D47A green, Barlow Condensed italic headlines, Bricolage Grotesque body copy and Space Mono labels. Real product photography places Power Rush beside the keyboard. A scroll-driven 3D sequence leads into an interactive flavor selector, transparent formula, preparation ritual and founder story.

## Scope

Only the home page and its new assets change. Every purchase link leads to the existing `/products/powerrush` page. The product detail page, shopping cart and checkout implementation are untouched. No prices or unverified review counts are introduced.

## Running locally

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. No build step is required. Existing Vercel configuration remains compatible.

## Assets and provenance

- Product meshes: the user's shared `MODELO 3D/power_rush.blend`.
- Label artwork: the original `etiqueta_bluefizz.png` and `etiqueta_cherry.png` from the same shared folder.
- Meshes, UV coordinates, packaging proportions, lid grooves and label artwork are preserved. Production materials are simplified to portable real-time PBR. The browser uses studio environment lighting and restrained clearcoat.
- Posters and setup scenes: optimized copies of official product photography already in the repository.
- Selective varnish masks: original UV masks supplied with the Blender model.
- The home loads the existing cart.js; cart implementation and PDP remain unchanged.
- Product copy and dosages: the supplied brand and product guides. All customer-facing copy remains in Argentine Spanish.

## Implementation

- `home.js`: navigation, flavor selection, scroll state, progressive 3D enhancement and accessibility behavior.
- `home.css`: responsive composition, native sticky sections and reduced-motion layouts.
- Three.js 0.170.0 renders the exported GLB models, with a generated studio environment. GLB files are about 1.2 MB and 1.0 MB.
- GSAP 3.13.0 / ScrollTrigger handle typographic entrances and scroll reveals.
- Lenis 1.3.11 smooths wheel scrolling. Touch scrolling stays native.
- Libraries are vendored locally. Font loading is the only external dependency of the new home.
- The flavor renderer and Cherry Pop model load as the user approaches that section.
- Rendering stops for offscreen scenes and hidden tabs. Mobile rendering is capped near 30 FPS and device pixel ratio is bounded.
- Reduced-motion users receive static product poses, a shortened focus section and no continuous animation. Static photography remains available when WebGL or model loading fails.
- Flavor selection uses native buttons with `aria-pressed`; FAQs use native `details`; mobile navigation supports Escape, focus wrapping, and `aria-expanded`.

## Third-party notices

- Three.js: MIT; see `vendor/THREE-LICENSE.txt`.
- Lenis: MIT; see `vendor/LENIS-LICENSE.txt`.
- GSAP / ScrollTrigger: copyright GreenSock, standard license. The original distribution headers are retained. License: https://gsap.com/standard-license/
- Barlow Condensed, Bricolage Grotesque and Space Mono are loaded via Google Fonts.

## Review notes

This is a home-page implementation for design review. Do not merge it to production until the visual direction has been reviewed. The source Blender scene and full-resolution source textures are intentionally excluded from the web repository.
