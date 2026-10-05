# Power Rush — Your next game starts here

An interactive home built around a continuous real-time product world. It retains the PDP's near-black surfaces, #00D47A green, Barlow Condensed italic headlines, Bricolage Grotesque body copy and Space Mono labels.

The opening now tells a five-chapter story: entry, focus, energy, reaction and formula. Chapter navigation and native scrolling work in both directions. Official Cherry Pop and Blue Fizz models alternate automatically between chapters, with manual flavor selection available until the next chapter.

Three original illustrated game environments fill the viewport: a fantasy forest battle map, a futuristic racing circuit and an industrial shooter arena. The background artwork and animated objects share one image-space projection, including zoom, responsive cropping and camera kick. Armored squads follow the mapped stone lane toward an opposing squad; clicking chooses a reachable position on that lane. A rear-view car steers with the pointer, arrow keys or touch buttons, with road motion aligned to the circuit vanishing point and a Rush boost. Floating robotic targets cast ground shadows and respond to shots with tracers, sparks, hit markers and combo feedback; successful hits advance the active target. These scenes are playful visual metaphors, not measurements of product effects. Both flavors have the same formula.

The environment images were generated using the built-in image tool and optimized to WebP (approximately 930 KB combined). The car and drone are original transparent sprites generated with the same built-in image tool. The product meshes, textures and packaging are the official supplied assets. `game-worlds.js` renders decorative action with bounded resolution and frame rate, pauses for hidden/offscreen views and respects reduced motion. Reduced motion and model-load failures retain a static benefit summary.

The lower page provides the interactive flavor selector, transparent ingredient list, preparation ritual, real setup photography and founder story.

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

- `world-projection.js`: shared artwork/effect coordinates and walkable forest lane.
- `game-worlds.js`: squad orders, steering and arena effects.
- `home.js`: navigation, flavor selection, scroll state, progressive 3D enhancement and accessibility behavior.
- `home.css`: shared home styles. `portal.css`: continuous opening composition and responsive choreography.
- Three.js 0.170.0 renders the exported GLB models, with a generated studio environment. GLB files are about 1.2 MB and 1.0 MB.
- GSAP 3.13.0 / ScrollTrigger handle typographic entrances and scroll reveals.
- Lenis 1.3.11 smooths wheel scrolling. Touch scrolling stays native.
- Libraries are vendored locally. Font loading is the only external dependency of the new home.
- The opening scene loads immediately; the separate flavor renderer loads near its section. Both reuse cached official models.
- Rendering stops for offscreen scenes and hidden tabs. Mobile rendering is capped near 30 FPS and device pixel ratio is bounded.
- Reduced-motion users receive static product poses, a shortened focus section and no continuous animation. Static photography remains available when WebGL or model loading fails.
- Flavor selection uses native buttons with `aria-pressed`; FAQs use native `details`; mobile navigation supports Escape, focus wrapping, and `aria-expanded`.

## Third-party notices

- Three.js: MIT; see `vendor/THREE-LICENSE.txt`.
- Lenis: MIT; see `vendor/LENIS-LICENSE.txt`.
- GSAP / ScrollTrigger: copyright GreenSock, standard license. The original distribution headers are retained. License: https://gsap.com/standard-license/
- Barlow Condensed, Bricolage Grotesque and Space Mono are loaded via Google Fonts.

## Review notes

Browser validation covers desktop (1440 px), mobile (390 px) and narrow mobile (320 px) layouts; forest click-to-order completion; left/right steering controls; forward and backward chapter navigation; automatic Blue Fizz / Cherry Pop changes; two successful target hits; Rush activation; reduced-motion benefit summaries; and JavaScript syntax / whitespace checks. Projection round trips, full-bleed coverage and nearest-lane targeting were checked at all three viewport sizes. Earlier static model-failure fallback remains in place.

This is a home-page implementation for design review. Do not merge it to production until the visual direction has been reviewed. The source Blender scene and full-resolution source textures are intentionally excluded from the web repository.
