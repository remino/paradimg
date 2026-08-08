# Paradimg

Browser-side image processing controlled through URL fragments.

Paradimg v0.1.1

By Rémino Rem  
<https://remino.net/>

[Docs](https://remino.net/paradimg/) |
[Code Repo](https://github.com/remino/paradimg) |
[npm Package](https://www.npmjs.com/package/paradimg)

---

<!-- mtoc-start -->

- [Installation](#installation)
    - [HTML (CDN)](#html-cdn)
    - [npm](#npm)
    - [Direct download](#direct-download)
- [Usage](#usage)
- [URL modifiers](#url-modifiers)
- [API](#api)
- [Custom pipelines](#custom-pipelines)
- [Behaviour](#behaviour)
- [Development](#development)
- [Licence](#licence)

<!-- mtoc-end -->

---

## Installation

### HTML (CDN)

Process marked image URLs automatically from a CDN:

```html
<script src="https://unpkg.com/paradimg"></script>
```

Mirrors:

- https://unpkg.com/paradimg
- https://cdn.jsdelivr.net/npm/paradimg

Use a pinned version in production:

```html
<script src="https://unpkg.com/paradimg@0.1.1"></script>
```

### npm

Install the package first:

```sh
npm install paradimg
```

Then process matching images automatically:

```js
import 'paradimg/auto'
```

Or call the explicit API when the page is ready:

```js
import { processImages } from 'paradimg'

await processImages()
```

### Direct download

Download the package tarball or individual files from npm/CDN:

- https://www.npmjs.com/package/paradimg
- https://unpkg.com/paradimg/dist/
- https://cdn.jsdelivr.net/npm/paradimg/dist/

The browser-ready auto-registration file is `dist/paradimg-auto.min.js`.

Distribution files:

- `dist/paradimg.mjs`: ES module library API.
- `dist/paradimg.cjs`: CommonJS library API.
- `dist/paradimg-auto.mjs`: ES module automatic entry.
- `dist/paradimg-auto.cjs`: CommonJS automatic entry.
- `dist/paradimg-auto.min.js`: minified classic browser automatic entry.

[Back to top](#)

---

## Usage

Add modifiers after `#?` in an image URL. They run from left to right.

```html
<img src="portrait.jpg#?half&dither=4x4,8c" alt="A pixelated portrait" />
```

Paradimg selects `img[src*="#?"]`, decodes the source image, renders each
requested effect to a Canvas, then replaces the image with a PNG object URL. The
original URL remains available in `data-image-processor-original-src`.

[Back to top](#)

---

## URL modifiers

| Modifier          | Description                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `brightness=1.15` | Multiplies each RGB channel. Defaults to `1.15`.                                                    |
| `contrast=1.2`    | Adjusts contrast around a midpoint of 128. Defaults to `1.2`.                                       |
| `bw`              | Converts to grayscale. Use `bw=invert` or `bw=threshold` for variants.                              |
| `half`            | Resizes the image to 50% with smoothing.                                                            |
| `double`          | Resizes to 200% with pixelated nearest-neighbour scaling.                                           |
| `dither`          | Applies an 8×8, 8-colour ordered dither.                                                            |
| `dither=4x4,4c`   | Chooses a Bayer matrix (`2x2`, `4x4`, `8x8`, `16x16`, `none`) and colour levels (`2c`, `4c`, `8c`). |
| `dither=8x8,bw`   | Uses two-level monochrome ordered dithering.                                                        |

Layout fragments can coexist with modifiers. Paradimg ignores unknown flags, so
an application can keep flags such as `large` or `full` for its own CSS:

```html
<img src="photo.jpg#?large&dither=4x4,4c" alt="Dithered photo" />
```

[Back to top](#)

---

## API

The package exports the processor and every built-in plugin:

```js
import {
    ImageProcessor,
    brightness,
    bw,
    contrast,
    createImageProcessor,
    dither,
    double,
    half,
    parseHashFlags,
    processImages,
} from 'paradimg'
```

`processImages(options?)` builds a default processor and resolves after every
matching image has been processed. `createImageProcessor(options?)` returns that
processor without running it. `parseHashFlags(src)` exposes the fragment parser.

[Back to top](#)

---

## Custom pipelines

Use only the effects and selector your page needs:

```js
import { ImageProcessor, dither, half } from 'paradimg'

const processor = new ImageProcessor([half, dither], 'img[data-pixel-art]')
await processor.processImages()
```

Plugins have a `keyword` and an async `process(img, context)` method. Register
your own plugin to introduce an application-specific URL modifier.

[Back to top](#)

---

## Behaviour

Dithered images are clickable after processing: clicking swaps between the
processed PNG and the original source. This is useful for inspecting an effect
without a separate before/after UI.

Paradimg is browser-only because it uses `<canvas>` and `HTMLImageElement`. For
a no-JavaScript baseline, generate static derivatives at build time and use
Paradimg as an optional enhancement.

[Back to top](#)

---

## Development

```sh
npm install
npm run build
npm test
```

Use Node 22.12 or newer. `npm run build` produces the npm library and the Astro
documentation site. `npm run release:dry-run` previews the release-it workflow.

[Back to top](#)

---

## Licence

ISC. See [LICENSE.md](LICENSE.md).
