import {
  AnimatePresence,
  animate,
  type MotionValue,
  motion,
  type Transition,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Variants,
} from "motion/react";
import { useMemo } from "react";

import type { StudyCard } from "./session-queue";
import { StudyCardView } from "./study-card";

/**
 * The deck as a stack of cards you throw away.
 *
 * Three rules hold this together:
 *
 * 1. **Only the front card is real.** It is the only one that drags, the only
 *    one that is not `inert`, and the only one that can be clicked. The cards
 *    behind it are scenery that happens to be the next card already in place.
 * 2. **Depth is derived, never stored.** A card's position in the stack is its
 *    index in the queue, so committing a rating is a queue change and the
 *    cards behind slide forward on their own - the same motion, whether the
 *    verdict came from a swipe, a button or a key.
 * 3. **At most three cards are mounted.** The queue can be hundreds of words;
 *    mounting them all to render two visible slivers would be absurd.
 */

/** How many cards are mounted: the front one, plus the two peeking behind it. */
const VISIBLE_CARDS = 3;

/** Past this much horizontal travel, letting go commits the verdict. */
const SWIPE_DISTANCE = 96;
/** A flick can commit earlier, as long as it went somewhere at all. */
const SWIPE_VELOCITY = 550;
const MIN_COMMIT_DISTANCE = 24;
/** Below this, a release is a tap on the card rather than the end of a swipe. */
const TAP_SLOP = 4;

/**
 * How strongly the card takes on the verdict colour at full commit distance.
 * Enough to be unmistakable, low enough that the word underneath stays readable
 * - the tint is feedback, not a curtain.
 */
const TINT_OPACITY = 0.28;

/**
 * How far a leaving card has to travel to be gone.
 *
 * Derived rather than picked: the card is centred, so its trailing edge clears
 * the viewport edge after `viewport/2 + card/2`, plus a little slack for the
 * tilt. The card is `w-full max-w-sm` inside a 16px gutter, so its width is
 * `min(384, viewport - 32)` and needs no measuring.
 *
 * This used to be one whole viewport width, which happened to be enough - but
 * only just. On a 390px screen it needed 374px and travelled 390px, a 16px
 * margin that any layout change could have eaten, ending the animation with the
 * card still faintly on screen.
 *
 * Read when the throw begins rather than on mount, so a resize or rotation
 * between one card and the next stays correct without a listener.
 */
const exitDistance = () => {
  if (typeof window === "undefined") return 900;
  const viewport = window.innerWidth;
  const card = Math.min(384, viewport - 32);
  return viewport / 2 + card / 2 + 32;
};

/**
 * How long a full-width throw takes. A card released mid-swipe covers only what
 * is left, in proportion - see `exitTransition`.
 *
 * 0.42s puts a phone-sized throw at roughly 950-1050px/s, which is within the
 * range of a real flick (500-1500px/s). The previous 0.32s worked out at about
 * 1250px/s average and considerably more at its peak, and that is why a button
 * press felt snapped: a swipe hands the card over already 100-150px out and
 * moving, so it only ever animated the remainder, while a button started it dead
 * centre and sent it the whole way in the same time.
 */
const FULL_EXIT_DURATION = 0.42;
/** Floor, so a card released almost gone does not vanish in a single frame. */
const MIN_EXIT_DURATION = 0.2;

/**
 * Time the throw by how far is actually left to go, so the two ways of rating a
 * card move at the same speed instead of taking the same time.
 *
 * The curve accelerates: something leaving should pick up speed, and an exit
 * that decelerates reads as arriving somewhere.
 */
function exitTransition(fromX: number, toX: number): Transition {
  const total = Math.abs(toX) || 1;
  const remaining = Math.abs(toX - fromX);
  const duration = Math.max(
    MIN_EXIT_DURATION,
    FULL_EXIT_DURATION * (remaining / total),
  );
  return { duration, ease: [0.32, 0, 0.67, 0] };
}

const SPRING: Transition = { type: "spring", stiffness: 320, damping: 32 };
const SPRING_BACK: Transition = { type: "spring", stiffness: 500, damping: 38 };
const INSTANT: Transition = { duration: 0 };

/** Reduced motion: no throw, no fade out over time, just gone. */
const VANISH: Variants = {
  out: { opacity: 0, transition: INSTANT },
};

/**
 * A card sits a little smaller, a little lower and a little dimmer for every
 * card in front of it.
 *
 * The numbers are picked so the cards behind clear the front card's bottom edge
 * by a few pixels: scaling from the centre pulls that edge *up* by about half
 * the size it loses, so the offset has to beat that before anything is visible
 * at all. They also have to stay inside the gap below the stack, which is why
 * the offset is this small.
 */
const depthScale = (depth: number) => 1 - depth * 0.045;
const depthOffset = (depth: number) => depth * 16;
const depthOpacity = (depth: number) => 1 - depth * 0.12;
/**
 * Cards behind are slightly out of focus, which is what stops the next word
 * being readable through the gap and reads as depth rather than as a copy.
 * `blur` is a filter, so it is animated by the same `animate` prop as the rest
 * of the depth transition and lands in step with it.
 */
const depthBlur = (depth: number) => `blur(${depth * 1.6}px)`;

interface CardStackProps {
  /** The queue, front card first. Only the first few are mounted. */
  cards: StudyCard[];
  /** Which card is showing its answer, by word id. */
  flippedKey: string | null;
  /** 1 when the last verdict was "correct", -1 when it was "incorrect". */
  exitDirection: 1 | -1;
  onFlip: () => void;
  onRate: (known: boolean) => void;
}

export function CardStack({
  cards,
  flippedKey,
  exitDirection,
  onFlip,
  onRate,
}: CardStackProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    /*
     * Nothing is clipped here, deliberately. A thrown card has to stay visible
     * all the way to the edge of the *screen*, and any clip at this level cuts
     * it off at the container instead - which on a wide viewport is nowhere near
     * the edge. The horizontal clip that stops the page growing sideways lives
     * on the page shell in `routes/root-layout.tsx`, which is viewport-wide.
     *
     * The vertical padding is still needed: a dragged card tilts, and its
     * corners reach about 40px past the square. Giving that room here means the
     * tilt never extends the document, so no vertical scrollbar appears either.
     * The matching negative margin keeps the stack occupying the same space in
     * the layout as the card itself.
     */
    <div className="relative -my-10 py-10">
      <div className="relative mx-auto aspect-square w-full max-w-sm">
        {/* `initial={false}` keeps the stack from animating in on the first
            render; cards that join later still slide up from behind. */}
        <AnimatePresence initial={false} custom={exitDirection}>
          {cards.slice(0, VISIBLE_CARDS).map((card, depth) => (
            <StackCard
              key={card.wordId}
              card={card}
              depth={depth}
              flipped={flippedKey === card.wordId}
              reduceMotion={reduceMotion}
              onFlip={onFlip}
              onRate={onRate}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface StackCardProps {
  card: StudyCard;
  depth: number;
  flipped: boolean;
  reduceMotion: boolean;
  onFlip: () => void;
  onRate: (known: boolean) => void;
}

function StackCard({
  card,
  depth,
  flipped,
  reduceMotion,
  onFlip,
  onRate,
}: StackCardProps) {
  // A leaving card keeps rendering until its exit finishes, and keeps the depth
  // it had - so it must stop being the interactive one, and must stay above the
  // card that has taken its place.
  const isPresent = useIsPresent();
  const isFront = depth === 0 && isPresent;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-12, 0, 12]);
  // The verdicts fade in over the same distance that commits them, so the
  // gesture says what it will do before you let go.
  const correctOpacity = useTransform(
    x,
    [MIN_COMMIT_DISTANCE, SWIPE_DISTANCE],
    [0, 1],
  );
  const incorrectOpacity = useTransform(
    x,
    [-SWIPE_DISTANCE, -MIN_COMMIT_DISTANCE],
    [1, 0],
  );
  // The wash of colour starts from the very first pixel, unlike the stamps.
  // Together they read as one gesture with two stages: the card takes on the
  // verdict's colour immediately, then the word appears once the throw is far
  // enough to actually commit.
  const correctTint = useTransform(x, [0, SWIPE_DISTANCE], [0, TINT_OPACITY]);
  const incorrectTint = useTransform(
    x,
    [0, -SWIPE_DISTANCE],
    [0, TINT_OPACITY],
  );

  /**
   * The exit, as a dynamic variant closing over this card's `x`.
   *
   * `AnimatePresence` hands its `custom` prop to children that are leaving,
   * which is how the card learns which way to fly - the verdict is known one
   * render before the card is gone. The variant is a function, so it runs at
   * that moment and can read where the card actually was when released, which is
   * what lets the throw be timed by distance rather than by a fixed duration.
   *
   * Only `x` is animated, and there is no fade. The tilt is derived from `x`, so
   * animating it here would give one value two writers; and clipping at the
   * viewport is what removes the card from sight, so fading it as well would make
   * it dissolve on the way out instead of leave.
   */
  const flyOut = useMemo<Variants>(
    () => ({
      out: (direction: number) => {
        const target = direction * exitDistance();
        return { x: target, transition: exitTransition(x.get(), target) };
      },
    }),
    [x],
  );

  const handleRelease = (offset: number, velocity: number) => {
    const wentFar = Math.abs(offset) > SWIPE_DISTANCE;
    const wentFast =
      Math.abs(velocity) > SWIPE_VELOCITY &&
      Math.abs(offset) > MIN_COMMIT_DISTANCE;

    if (!wentFar && !wentFast) {
      // Undecided: back to the middle, nothing rated.
      if (reduceMotion) x.set(0);
      else animate(x, 0, SPRING_BACK);
      return;
    }

    // Right is correct, left is incorrect - the same way round as the arrow
    // keys and the buttons. Rating drops this card from the queue, and the exit
    // animation carries it the rest of the way from wherever it was let go.
    onRate(offset > 0);
  };

  const handleFlip = () => {
    // A swipe ends with a click on the face it started on. The card is still
    // off-centre at that point, which is what tells the two apart.
    if (Math.abs(x.get()) > TAP_SLOP) return;
    onFlip();
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x,
        rotate,
        // The card on its way out has to outrank the one that replaced it.
        zIndex: VISIBLE_CARDS - depth + (isPresent ? 0 : VISIBLE_CARDS),
        pointerEvents: isFront ? "auto" : "none",
      }}
      // A card joins the stack from one slot further back, so it rises into
      // place instead of appearing.
      initial={{
        scale: depthScale(depth + 1),
        y: depthOffset(depth + 1),
        opacity: 0,
        filter: depthBlur(depth + 1),
      }}
      animate={{
        scale: depthScale(depth),
        y: depthOffset(depth),
        opacity: depthOpacity(depth),
        // Sharpens as it comes forward, so arriving at the front *is* becoming
        // readable.
        filter: depthBlur(depth),
      }}
      transition={reduceMotion ? INSTANT : SPRING}
      variants={reduceMotion ? VANISH : flyOut}
      exit="out"
      drag={isFront ? "x" : false}
      // No inertia after release: either this card is leaving, or it is coming
      // back to the middle. Drifting is neither.
      dragMomentum={false}
      onDragEnd={(_event, info) =>
        handleRelease(info.offset.x, info.velocity.x)
      }
      inert={!isFront}
    >
      <StudyCardView
        card={card}
        flipped={flipped}
        transition={reduceMotion ? INSTANT : SPRING}
        onFlip={handleFlip}
      />
      {/* Outside the flipping element on purpose: these must not turn with the
          card, and they must paint over both faces. */}
      <SwipeTint color="incorrect" opacity={incorrectTint} />
      <SwipeTint color="correct" opacity={correctTint} />
      <SwipeVerdict label="Incorrect" side="left" opacity={incorrectOpacity} />
      <SwipeVerdict label="Correct" side="right" opacity={correctOpacity} />
    </motion.div>
  );
}

interface SwipeTintProps {
  color: "correct" | "incorrect";
  opacity: MotionValue<number>;
}

/**
 * The verdict colour washing over the card as it is dragged.
 *
 * Two independently faded layers rather than one layer whose colour is
 * interpolated: the tokens are `oklch`, and asking an animation library to
 * interpolate between two colour *strings* invites it to fall back to something
 * that does not resolve a CSS variable at all. Opacity always interpolates.
 *
 * `rounded-xl` matches the card face it covers, so the wash stops at the same
 * corners rather than squaring them off.
 */
function SwipeTint({ color, opacity }: SwipeTintProps) {
  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity }}
      className={
        color === "correct"
          ? "pointer-events-none absolute inset-0 rounded-xl bg-correct"
          : "pointer-events-none absolute inset-0 rounded-xl bg-incorrect"
      }
    />
  );
}

interface SwipeVerdictProps {
  label: string;
  side: "left" | "right";
  opacity: MotionValue<number>;
}

/**
 * The stamp that appears under your thumb as you drag. Decorative: the rating
 * buttons carry the same two words, in text, permanently.
 */
function SwipeVerdict({ label, side, opacity }: SwipeVerdictProps) {
  const isCorrect = side === "right";

  return (
    <motion.div
      aria-hidden="true"
      style={{ opacity }}
      className={
        isCorrect
          ? "pointer-events-none absolute top-5 right-5 rotate-6 rounded-lg border-2 border-correct px-3 py-1 text-sm font-semibold tracking-wide text-correct uppercase"
          : "pointer-events-none absolute top-5 left-5 -rotate-6 rounded-lg border-2 border-incorrect px-3 py-1 text-sm font-semibold tracking-wide text-incorrect uppercase"
      }
    >
      {label}
    </motion.div>
  );
}
