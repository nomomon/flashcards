import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link, Outlet } from "@tanstack/react-router";
import { HomeIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react";

import { buildLabel, commitUrl } from "@/build-info";
import { Button } from "@/components/ui/button";
import { useTimeOnTask } from "@/lib/stats/use-time-on-task";

/**
 * The one page shell: mobile-first, centred, same padding on every route.
 *
 * It is an app shell rather than a document: the outer element is exactly one
 * viewport tall and never scrolls, and `main` scrolls inside it. That is the
 * difference between "flush" and "nearly flush" in an installed PWA. With the
 * document scrolling, every route carried the footer's height on top of its own
 * content, so a page that visually fit still scrolled a few pixels - the Stats
 * page overran by exactly 8px - and each of those drags rubber-banded the whole
 * app off its own edges. Here a page either fits or scrolls inside a frame that
 * cannot move.
 *
 * The safe-area padding is the other half of filling the screen. `viewport-fit=cover`
 * in index.html lets the background paint under the notch and the home
 * indicator; these insets are what keep the content out from under them. They
 * sit on the frame rather than on `main`, so a sticky bar inside stops at the
 * home indicator instead of under it.
 *
 * `overflow-x-clip` is on the scroller rather than around the study cards on
 * purpose. A swiped card is transformed, and a transform extends the scrollable
 * overflow of every ancestor, so throwing one off screen used to grow the page
 * sideways and raise a scrollbar mid-gesture. Clipping closer to the card also
 * worked, but it clipped at the *container* edge, so on any screen wider than
 * the card the throw visibly stopped short instead of leaving the window. This
 * element is viewport-wide - the column's `max-w-3xl` is on the child - so
 * clipping here means a card stays visible until it genuinely passes the edge
 * of the screen.
 *
 * `data-scroll-restoration-id` is not decoration: the router restores the
 * window's scroll by default, and moving the scroll into an element would
 * otherwise mean coming back to a deck at the top of its word list every time.
 */
export function RootLayout() {
  // Mounted once, at the root, so "time spent" means time in the app rather
  // than time on the study screen - reading a deck's word list is studying too.
  // It counts only while the tab is visible and recently interacted with; see
  // the hook for why that matters.
  useTimeOnTask();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      <main
        data-scroll-restoration-id="app-shell"
        className="flex flex-1 flex-col overflow-x-clip overflow-y-auto overscroll-contain"
      >
        {/* `w-full` because the scroller is a flex column, where `mx-auto`
            alone overrides the default stretch and leaves the column as wide as
            whatever it happens to contain. */}
        <div className="mx-auto w-full max-w-3xl px-4 pt-8">
          <Outlet />
        </div>
        <BuildFooter />
      </main>
    </div>
  );
}

/**
 * Which commit am I looking at? A diagnostic, not a feature: it lives at the
 * very bottom of every route, quiet enough to ignore until the answer to
 * "is the fix deployed yet?" is needed.
 *
 * `mt-auto` rather than a fixed top margin, because a fixed one is a tax every
 * route pays in height. This footer is ~110px of chrome for a commit hash; on
 * any page whose content nearly fills the screen, that alone is what turns "it
 * fits" into "it scrolls a few pixels". As a flex auto-margin it takes the
 * leftover space when there is some and none when there is not, so it is parked
 * at the bottom of a short page for free and spaced off the end of a long one.
 */
function BuildFooter() {
  const label = buildLabel();
  const url = commitUrl();

  return (
    <footer className="mx-auto mt-auto w-full max-w-3xl px-4 pt-8 pb-8 text-center text-xs text-muted-foreground">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline"
        >
          {label}
        </a>
      ) : (
        <span>{label}</span>
      )}
    </footer>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        That link does not point anywhere in this app.
      </p>
      <Button asChild size="lg" className="h-11">
        <Link to="/">
          <HomeIcon />
          Back to decks
        </Link>
      </Button>
    </div>
  );
}

export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const message =
    error instanceof Error ? error.message : "Something went wrong.";

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <TriangleAlertIcon className="size-8 text-destructive" />
      <h1 className="font-heading text-2xl font-semibold">
        This screen crashed
      </h1>
      <p className="max-w-md text-sm break-words text-muted-foreground">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="lg" className="h-11" onClick={reset}>
          <RotateCcwIcon />
          Try again
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11">
          <Link to="/">
            <HomeIcon />
            Back to decks
          </Link>
        </Button>
      </div>
    </div>
  );
}
