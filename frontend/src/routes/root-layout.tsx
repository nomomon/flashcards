import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link, Outlet } from "@tanstack/react-router";
import { HomeIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react";

import { buildLabel, commitUrl } from "@/build-info";
import { Button } from "@/components/ui/button";

/**
 * The one page shell: mobile-first, centred, same padding on every route.
 *
 * `overflow-x-clip` is here rather than around the study cards on purpose. A
 * swiped card is transformed, and a transform extends the scrollable overflow of
 * every ancestor, so throwing one off screen used to grow the document sideways
 * and raise a scrollbar mid-gesture. Clipping closer to the card also worked,
 * but it clipped at the *container* edge, so on any screen wider than the card
 * the throw visibly stopped short instead of leaving the window.
 *
 * This element is viewport-wide, so clipping here means a card stays visible
 * until it genuinely passes the edge of the screen. `clip` rather than `hidden`
 * because it paints nothing outside the box without becoming a scroll container,
 * which keeps this out of the scroll chain entirely.
 */
export function RootLayout() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-background">
      <main className="mx-auto max-w-3xl px-4 pt-8">
        <Outlet />
      </main>
      <BuildFooter />
    </div>
  );
}

/**
 * Which commit am I looking at? A diagnostic, not a feature: it lives at the
 * very bottom of every route, quiet enough to ignore until the answer to
 * "is the fix deployed yet?" is needed.
 */
function BuildFooter() {
  const label = buildLabel();
  const url = commitUrl();

  return (
    <footer className="mx-auto mt-16 max-w-3xl px-4 pb-8 text-center text-xs text-muted-foreground">
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
