import { useEffect, useState } from "react";

/**
 * Has `target` scrolled up out of sight, past a line `offsetPx` below the top of
 * the viewport?
 *
 * It takes an **element rather than a ref** on purpose. The things worth
 * watching here appear late - the deck's heading only exists once the manifest
 * has arrived - and a ref quietly filling in its `current` does not re-run an
 * effect, so the observer would attach to nothing and never fire. Holding the
 * node in state means the caller passes the setter straight to `ref=` and this
 * re-runs the moment the element shows up.
 *
 * `offsetPx` is what makes a handoff to a sticky header look deliberate: the
 * line is the *bottom* of that header, so a title is replaced exactly as it
 * slides under it rather than a header's height too late.
 *
 * An observer rather than a scroll listener because the answer only changes
 * twice per page, and a listener would ask the question on every frame of every
 * scroll to hear "no" nearly every time.
 */
export function useScrolledPast(
  target: HTMLElement | null,
  offsetPx = 0,
): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!target) {
      setPast(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // "Not intersecting" covers both above the line and below the fold, and
        // only one of those is scrolled past - so the side matters, not just the
        // fact of being out of view.
        const line = entry.rootBounds?.top ?? offsetPx;
        setPast(!entry.isIntersecting && entry.boundingClientRect.top < line);
      },
      { rootMargin: `-${offsetPx}px 0px 0px 0px` },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [target, offsetPx]);

  return past;
}
