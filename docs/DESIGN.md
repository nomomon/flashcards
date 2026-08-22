# Design language

The repo's copy of the visual system. A manual, not a brandbook: every number
here is traceable to something the app already does, and nothing in it is a rule
for its own sake.

## The idea in one line

One square, cut once. The square is the deck tile and the cut is the gutter
between the word list's two columns, so the mark is the product's own negative
space rather than a shape invented alongside it.

## The legend

> Every card is one thing with two faces. Turn it over and the far side is the
> same shape as the near one: the word you are reaching for and the word you
> already have, cut from a single piece. What separates them is a gap exactly one
> silence wide, the pause at the counter when the sentence is ready and the word
> is not. The app exists to close it. So the gap is the mark.

## The sign

`frontend/public/mark.svg` is the source. `frontend/src/components/mark.tsx` is
the same geometry as a component.

| Quantity | Value | Taken from |
| --- | --- | --- |
| Box | `100 × 100` | The deck tile is `aspect-square`. |
| Corner radius | `26` | The tile's `rounded-xl` is 0.29·S. The mark is a touch tighter, at 0.26, because at icon scale the rounder corner reads as a pill. |
| Seam | `M 50 -20 L 50 0 C 50 20 56 30 50 50 C 44 70 50 80 50 100 L 50 120` | The gutter of the word list's `grid-cols-2`. |
| Lean | `22°` | Measured: at 0° the seam is an inert gutter, at 38° the glyphs are squeezed into the corners. |
| Seam width | `10` | 10% of the box. Widens to 13-15% below 32px so it stays open. |
| Lateral deviation | `2.65` | The curve's actual maximum departure from straight, 2.6% of the box. The restraint is the point. |
| Max tangent angle | `7.3°` | From vertical, at `s = 1/3`. Small enough that the two halves can be cut by translation with the gap staying even to within 0.8%. |

The seam runs from `-20` to `120` rather than `0` to `100`. Rotating a path that
spans exactly the box pulls its endpoints inward by `50 × (1 - cos 22°) = 3.64`,
which leaves the cut short of both edges and the two halves joined - fatal for a
mark whose claim is that the square is cut once. The straight runs extend it with
C1 continuity, since the curve's tangents are already vertical there, and the clip
takes the overshoot off. The extended seam crosses `y = 0` at `x = 70.2`, inside
the flat span of `26..74`, so it exits through the edge and not a corner.

The seam has vertical tangents at both edges and is symmetric under a 180°
rotation about the centre, so the two pieces it cuts are **congruent**: each is
the other turned around. That is the claim that a card's two faces are one card.
Rotating `(50,0)→(50,100)`, `(50,20)→(50,80)`, `(56,30)→(44,70)` maps the path
onto itself exactly.

### The glyph pair is a variable

The frame is fixed; what sits either side of the seam is chosen per surface. At
40px and above, the pair. Below that it drops away and the bare seam carries the
mark alone, which is why the lean matters: leaning, the small mark is a confident
stroke; vertical, it was two inert bars.

The mark says *languages*. A deck's own lucide icon says *this deck's subject*.
They never do each other's job.

## Colour

One signature hue, declared once as `--hue: 295` in `index.css`. Every neutral in
the app carries a trace of it, 0.003 to 0.018 chroma: under the threshold where a
grey reads as coloured, over the one where it reads as unconsidered. Changing that
single number moves the whole app's temperature.

Two kinds of colour, and they never occupy the same surface:

- **A deck's hue** owns deck surfaces. It arrives from `library.json` as data and
  is mixed into a surface rather than used as one, because a hue from a file
  cannot be given legible text by CSS:

  ```
  --deck-surface: color-mix(in oklab, <deck> 12%, var(--card));
  --deck-edge:    color-mix(in oklab, <deck> 30%, var(--border));
  --deck-accent:  color-mix(in oklab, <deck> 70%, var(--foreground));
  ```

  One expression, both themes: a pale tint on white, a deep one on black, text
  always the normal foreground. `oklab` because sRGB takes saturated hues through
  a muddy middle.

- **The brand hue** owns actions and focus: `--primary`, `--ring`. Nothing else.

Verdict colours (`--correct`, `--incorrect`) stay separate from `--destructive`
even though both reds look alike, because destructive marks an action that loses
data while incorrect marks an answer.

### Measured contrast

| pair | light | dark |
| --- | --- | --- |
| foreground on background | 19.14:1 | 18.92:1 |
| muted-foreground on background | 4.74:1 | 7.70:1 |
| primary-foreground on primary | 5.82:1 | 7.12:1 |
| primary on background | 6.00:1 | 7.50:1 |

All pass WCAG AA for text. `border` on `background` is ~1.3:1 by design: a
hairline divider is neither text nor a control boundary.

## Atmosphere

The gradient. Three rules keep a saturated gradient liveable in an app whose
colour otherwise belongs to data, and they are enforced by `.bloom` in
`index.css`:

1. **It is never a surface.** Nothing is read on top of a bloom. The blur is past
   legibility on purpose.
2. **It is a separate layer**, not a background on a content box, so the blur gets
   bleed room without the clip reaching real content.
3. **The grain is not decoration.** A gradient across three hues bands visibly on
   an 8-bit display; noise at low opacity is what breaks the banding up. It earns
   its place before it looks nice.

Three placements, and no more:

| Where | Whose colour | Why there |
| --- | --- | --- |
| Deck tiles | the deck's | The one large surface a deck owns. |
| Study complete | the brand's | Finishing a deck is the app's only emotional beat. |
| App icon, social image | the brand's | No text to sit behind. |

`.bloom-fade` masks its own edge. Without it a clipped bloom reads as a coloured
disc behind the content rather than as light coming off it.

## Type

Geist Variable, one family, `--font-heading` aliased to `--font-sans`. One family
because the app is 150 rows of word pairs and a display face would be doing
nothing at that density.

`2xl/600` for a deck title, `base` for words, `sm` for anything muted,
`xs/500/uppercase/tracking-wide` for the two column headers. Tabular numerals
wherever counts line up.

## Motion

The sign's animation is the app's own gesture, so these are constants that
already existed rather than new ones:

| Gesture | Constant | Where |
| --- | --- | --- |
| The turn | `rotateY 0→180`, `perspective 1200` | `study-card.tsx` |
| Its spring | `stiffness 320, damping 32` | `card-stack.tsx` |
| The throw | `cubic-bezier(0.32, 0, 0.67, 0)` | Timed by distance, not duration. |
| Its tilt | `±12°` across `±240px` | The card leans into the swipe. |

## Assets

| File | What |
| --- | --- |
| `frontend/public/mark.svg` | Vector source, reduced mark, `currentColor` |
| `frontend/public/favicon{,-32,-16}.png` | Bare seam, per the reduction rule |
| `frontend/public/apple-touch-icon.png` | 180px lockup; iOS ignores the manifest icons |
| `frontend/public/icons/icon-{192,512}.png` | `purpose: any` |
| `frontend/public/icons/icon-maskable-512.png` | Mark at 74%, ground takes the crop |
| `frontend/public/social.jpg` | 1280×640 link preview. JPEG, because a grain gradient costs 748KB as PNG and 88KB here. |

The icons are deliberately excluded from the service worker precache
(`includeManifestIcons: false` plus a `manifestTransforms` filter): the OS fetches
them once at install, so caching them for offline use buys nothing.
