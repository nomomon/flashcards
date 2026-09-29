# Design language

The repo's copy of the visual system. A manual, not a brandbook: every number
here is traceable to something measured, and nothing in it is a rule for its own
sake.

## The mark

A globe in a speech bubble, in Google's four brand colours. It says *languages*
before it says anything else, which is the one job an app icon has here.

`frontend/public/mark.svg` is the source; `frontend/src/components/mark.tsx` is
the same geometry as a component.

Two halves to how it is built, and the split is deliberate:

- **The bubble is drawn.** A circle at `cx 47.41, cy 47.41, r 47.41`, plus a
  tail. Tracing it from the source raster left a visibly torn outline, because
  the source was a small image with antialiased edges. A circle is a circle.
- **The continents are traced.** They are organic, so they were extracted from
  the source at 72px, simplified with Ramer-Douglas-Peucker at `ε 0.85`, and
  smoothed through a closed Catmull-Rom spline at tension `0.16`. That is why
  the coastlines read as coastlines rather than as a staircase.

The whole mark is then scaled to `0.9246` and centred, so the circle plus the
tail sit inside the square with an even margin.

The mark carries its own colours rather than taking `currentColor`. There is no
monochrome reduction of it that still says "languages", which is a real trade
against the mark it replaced: that one could take a deck's accent, this one
cannot.

## Colour

### Two kinds, never on the same surface

- **A deck's hue** owns deck surfaces, and is untouched by this palette. It
  arrives from `library.json` as data and is mixed into a surface rather than
  used as one, because a hue from a file cannot be given legible text by CSS:

  ```
  --deck-surface: color-mix(in oklab, <deck> 12%, var(--card));
  --deck-edge:    color-mix(in oklab, <deck> 30%, var(--border));
  --deck-accent:  color-mix(in oklab, <deck> 70%, var(--foreground));
  ```

- **The brand hue** owns actions and focus: `--primary`, `--ring`. Nothing else.

### The signature hue

`--hue: 260`, declared once. Every neutral carries a trace of it at 0.003 to
0.018 chroma: under the threshold where a grey reads as coloured, over the one
where it reads as unconsidered.

260 is not a taste call. Google Blue 500 (`#4285F4`) converts to
`oklch(0.630 0.180 260.0)`, so the greys are tinted by the brand's own hue and
one number still moves the whole app's temperature.

### Which weight, and why

Google's published values, used verbatim. The weight is chosen by measurement,
not by which one is the "real" brand colour:

| Token | Light | Dark | Measured |
| --- | --- | --- | --- |
| `--primary` | Blue 700 `#1967d2` | Blue 300 `#8ab4f8` | 5.37:1 behind white, 5.27:1 as text |
| `--correct` | Green 700 `#188038` | Green 300 `#81c995` | 5.02:1 / 8.77:1 |
| `--incorrect` | Red 600 `#d93025` | Red 300 `#f28b82` | 4.77:1 / 7.50:1 |

The 500s do not carry text anywhere. White on Blue 500 measures **3.56:1**,
under AA. Blue 600 clears it as a button (4.51:1) but only reaches 4.43:1 as a
link on the page background, so `--primary` is Blue 700, which clears both
directions. The 500s stay where nothing is read on them: the app icon, and the
bloom.

Yellow never carries text at all. Yellow 700 on white is **2.21:1**; it exists
in this palette only inside the icon and the bloom.

### Measured contrast, both themes

| pair | light | dark |
| --- | --- | --- |
| foreground / background | 19.12:1 | 18.96:1 |
| muted-foreground / background | 4.75:1 | 7.78:1 |
| primary-foreground / primary | 5.37:1 | 8.18:1 |
| primary / background | 5.27:1 | 9.40:1 |
| correct / card | 5.02:1 | 9.16:1 |
| incorrect / card | 4.77:1 | 7.51:1 |
| chart-correct / card | 5.75:1 | 5.22:1 |
| chart-incorrect / card | 3.57:1 | 5.48:1 |

Everything carrying text clears AA; the two chart series clear the 3:1 a
non-text graphic needs. `border` on `background` is ~1.3:1 by design, a hairline
divider being neither text nor a control boundary.

## Atmosphere

The gradient. Three rules keep a saturated gradient liveable in an app whose
colour otherwise belongs to deck data, enforced by `.bloom` in `index.css`:

1. **It is never a surface.** Nothing is read on top of a bloom. The blur is
   past legibility on purpose.
2. **It is a separate layer**, not a background on a content box, so the blur
   gets bleed room without the clip reaching real content.
3. **The grain is not decoration.** A gradient across four hues bands visibly on
   an 8-bit display; noise at low opacity is what breaks the banding up.

Four stops, one per brand colour, at full 500 strength in **both** themes.
Lifting them to the 300 weights for dark, the way `--primary` is lifted, turned
the bloom grey: four pastels blurred into each other average out. Nothing is
read on a bloom, so saturation costs nothing and is what makes it glow.

Three placements, and no more:

| Where | Whose colour | Why there |
| --- | --- | --- |
| Deck tiles | the deck's | The one large surface a deck owns. |
| Study complete, stats empty state | the brand's | The app's only emotional beats. |
| App icon, social image | the brand's | No text to sit behind. |

`.bloom-fade` masks its own edge. Without it a clipped bloom reads as a coloured
disc behind the content rather than as light coming off it.

## Type

Geist Variable, one family, `--font-heading` aliased to `--font-sans`. One
family because the app is hundreds of rows of word pairs and a display face
would be doing nothing at that density.

`2xl/600` for a deck title, `base` for words, `sm` for anything muted,
`xs/500/uppercase/tracking-wide` for the two column headers. Tabular numerals
wherever counts line up.

## Motion

These are constants the app already ran on, not new ones:

| Gesture | Constant | Where |
| --- | --- | --- |
| The turn | `rotateY 0→180`, `perspective 1200` | `study-card.tsx` |
| Its spring | `stiffness 320, damping 32` | `card-stack.tsx` |
| The throw | `cubic-bezier(0.32, 0, 0.67, 0)` | Timed by distance, not duration. |
| Its tilt | `±12°` across `±240px` | The card leans into the swipe. |

## Assets

| File | What |
| --- | --- |
| `frontend/public/mark.svg` | Vector source |
| `frontend/public/favicon{,-32,-16}.png` | Transparent, so either tab strip works |
| `frontend/public/apple-touch-icon.png` | 180px on white; iOS composites transparency on black |
| `frontend/public/icons/icon-{192,512}.png` | `purpose: any`, white field |
| `frontend/public/icons/icon-maskable-512.png` | Art inside the 80% safe circle, field takes the crop |
| `frontend/public/social.jpg` | 1280×640 link preview, JPEG because a grain gradient is cheap this way and expensive as PNG |

The icons are deliberately excluded from the service worker precache
(`includeManifestIcons: false` plus a `manifestTransforms` filter): the OS
fetches them once at install, so caching them for offline use buys nothing.

## A note on provenance

The mark is a redraw of a Google product icon, in Google's brand colours. That
is a deliberate choice by the repo owner and not a neutral one: the app is
public and MIT licensed, so the mark carries a trademark risk and can lead
people to read the app as a Google product. Changing the bubble shape, the
continent arrangement, or the palette would all reduce that, and none of them
would cost the idea.
