import { useEffect, useRef } from "react";

import { useRecordTime } from "./queries";

/**
 * How long the app is actually used, accumulated into today's bucket.
 *
 * "Time spent" is easy to measure dishonestly. A tab left open overnight would
 * report eight hours of Dutch, and a number that inflates itself is worse than
 * no number - it is the one figure on the stats page a learner cannot sanity
 * check against anything else. Three rules keep it defensible:
 *
 * 1. **Hidden does not count.** Nothing accumulates while the tab is in the
 *    background or the phone is locked.
 * 2. **Idle does not count.** After `IDLE_MS` with no pointer, key, wheel or
 *    scroll event the clock stops, and starts again on the next interaction.
 *    The window is generous on purpose: reading a card you cannot recall is
 *    studying, and cutting that off at thirty seconds would undercount the
 *    hardest part of the work.
 * 3. **A tick can never contribute more than it measures.** Browsers throttle
 *    and coalesce timers, so an interval that should fire every five seconds
 *    can arrive minutes late. Each tick adds the real elapsed time, capped at
 *    `MAX_TICK_MS`, rather than assuming it fired on schedule.
 *
 * Mounted once, in the root layout, so this measures time in the app rather
 * than time on the study screen - which is what a learner means by the phrase,
 * and it makes browsing a deck's word list count as the studying it is.
 */

const TICK_MS = 5_000;
/** Two ticks. Anything longer is a throttled timer, not time spent. */
const MAX_TICK_MS = TICK_MS * 2;
const IDLE_MS = 90_000;
/** Batch writes: one localStorage round-trip per half minute of real use. */
const FLUSH_MS = 30_000;

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
] as const;

export function useTimeOnTask(): void {
  const { mutate: recordTime } = useRecordTime();

  const recordTimeRef = useRef(recordTime);
  recordTimeRef.current = recordTime;

  /** Measured but not yet written. */
  const pendingRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastActivityRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    lastTickRef.current = now;
    // Arriving on the page is itself the first interaction; without this the
    // clock would not start until the learner touched something.
    lastActivityRef.current = now;

    const flush = () => {
      const ms = pendingRef.current;
      if (ms <= 0) return;
      pendingRef.current = 0;
      recordTimeRef.current({ ms });
    };

    const markActive = () => {
      lastActivityRef.current = Date.now();
    };

    const tick = () => {
      const at = Date.now();
      const elapsed = at - lastTickRef.current;
      lastTickRef.current = at;

      if (document.hidden) return;
      if (at - lastActivityRef.current > IDLE_MS) return;

      pendingRef.current += Math.min(elapsed, MAX_TICK_MS);
      if (pendingRef.current >= FLUSH_MS) flush();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Write the tail before the tab can be discarded, and stop the clock.
        flush();
      } else {
        // Coming back is an interaction, and the gap while hidden is not time
        // spent - so the next tick measures from now, not from before it.
        lastTickRef.current = Date.now();
        markActive();
      }
    };

    const interval = window.setInterval(tick, TICK_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    // `pagehide` rather than `beforeunload`: it fires on mobile Safari's
    // back/forward cache path, which is how this app usually gets closed.
    window.addEventListener("pagehide", flush);
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, markActive, { passive: true });
    }

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", flush);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, markActive);
      }
      flush();
    };
  }, []);
}
