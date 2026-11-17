# Emlak AG – Front page demo

A redesign concept for the [emlak-ag.de](https://emlak-ag.de/) front page, built around **CSS scroll-driven animations** (`animation-timeline: scroll()` / `view()`).

It is a static site with no build step. Open `index.html` through any static server:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. (Opening the file directly with `file://` also works, except that some browsers block loading the `.glb` models that way.)

## What scrolls

| Section | Effect | Technique |
| --- | --- | --- |
| Header | Reading-progress bar; the pill header tightens | `scroll(root)` |
| Hero | Full-bleed photo recedes into a framed "window", the headline blurs out and a tagline fades in | `scroll(root)` with `animation-range` in `vh` |
| Marquee | Two rows of object types slide in opposite directions | `view()` / `cover` |
| **Objekte** | **Parallax carousel**: the image slides across inside each card as it crosses the scrollport (from the *Parallax Carousel* demo) | `view(x)` + `object-position` |
| Statement | Text fills in line by line while pinned | Named `view-timeline` + inline `background-clip: text` |
| Werte | Stacking cards that shrink and dim as the next one covers them | `view-timeline` on the stack, `animation-range: contain …` |
| Stats | Numbers count up | `@property --num` (integer) + `counter()` |
| Leistungen | Vertical scroll drives a horizontal track of services | Sticky stage + `translateX(calc(-100% + 100vw))` |
| **3D-Quartier** | **3D buildings rotate as you scroll the cards sideways**, with titles clipping in and out (from the *3D Shoe Explorer* demo) | `view-timeline: --card inline` + `trackProgress()` → `<model-viewer orientation>` |
| Architektur | Iris reveal: a circle opens onto the photo, then chips pop in | `clip-path: circle()` on a named view timeline |
| BESTpreis | Items slide in and the check marks draw themselves | `view()` + `stroke-dashoffset` |
| Rechner | Mortgage calculator card rises in. The calculation works for real | `view()` |
| Kontakt / Footer | Masked headline reveal; the wordmark rises | `view()` |

All scroll-driven rules are scoped under `html.sda`:

* Chromium-based browsers and Safari 26+ get the native implementation.
* Other browsers load the [scroll-timeline polyfill](https://github.com/flackr/scroll-timeline) (`vendor/scroll-timeline.js`).
* With `prefers-reduced-motion: reduce`, the page is a clean static layout with no scroll effects.

## Sources & licences

### Photos – Unsplash

The building and interior photos are hot-linked from `images.unsplash.com` under the [Unsplash License](https://unsplash.com/license), which allows free commercial use with no attribution required. Unsplash plays the role picsum.photos plays in the original demos, but with real architecture. Each URL sets the size and crop, e.g.:

```
https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&h=900&q=70
```

Before going live, replace them with Emlak AG's own property photos (or download and self-host the Unsplash ones).

### 3D models (`models/`)

| File | Source | Licence |
| --- | --- | --- |
| `LittlestTokyo.glb` | ["Littlest Tokyo" by glenatron](https://sketchfab.com/models/94b24a60dc1b48248de50bf087c0f042), via the three.js examples | CC BY 4.0, attribution shown on the card |
| `building-small-*.glb` | [Kenney – City Builder Starter Kit](https://github.com/KenneyNL/Starter-Kit-City-Builder) (textures embedded) | CC0 |
| `quartier.glb` | Composed from the Kenney tiles above by `models/build-quartier.mjs` (gltf-transform) | CC0 |

Other good places to find free building models: [Poly Pizza](https://poly.pizza) (CC0/CC-BY low-poly), [Kenney.nl](https://kenney.nl/assets), [Quaternius](https://quaternius.com), and [Sketchfab](https://sketchfab.com/search?features=downloadable&licenses=7c23a1ba438d4306920229c12afcb5f9&q=building&type=models) with the "downloadable" and CC filters. Sketchfab has real photogrammetry scans of buildings, but downloading needs an account. Export as `.glb`, keep it under a few MB, and drop it in `models/`. Draco-compressed files work: the decoder is vendored in `vendor/draco/`.

### Libraries (`vendor/`)

* [`@google/model-viewer`](https://modelviewer.dev) 4.1.0 – Apache-2.0
* [`scroll-timeline-polyfill`](https://github.com/flackr/scroll-timeline) 1.1.0 – Apache-2.0
* Draco decoder (`vendor/draco/`, from the three.js examples) – Apache-2.0, so `<model-viewer>` needn't fetch it from gstatic.com
* `trackProgress` from [`@bramus/sda-utilities`](https://www.npmjs.com/package/@bramus/sda-utilities) – MIT, inlined in `assets/js/main.js`

### Content

The copy, contact details and links come from the current emlak-ag.de front page. The logo is Emlak AG's own (`assets/img/emlak-logo.png`).
