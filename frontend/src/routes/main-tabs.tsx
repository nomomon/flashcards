import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Mark } from "@/components/mark";
import { cn } from "@/lib/utils";

/**
 * The shell the two top-level screens share: the mark, the app's name, an
 * optional action, and the tab bar between them.
 *
 * It lives in `routes/` rather than in a feature because it is page
 * composition - it knows the route tree and nothing about decks or statistics -
 * and because the alternative, a feature folder holding one navigation
 * component, would be a folder that exists to satisfy a rule rather than to
 * hold a domain.
 *
 * The header names the app rather than the screen: with a tab bar directly
 * underneath, a heading that repeats the selected tab is the same word twice.
 */

const TAB_CLASS =
  "flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition-colors";

const TABS = [
  { to: "/", label: "Decks" },
  { to: "/stats", label: "Stats" },
] as const;

export function MainHeader({ action }: { action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {/* Below 40px the glyph pair stops being legible, so the header wears
              the reduced mark. */}
          <Mark className="size-9 shrink-0 text-primary" />
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Flashcards
          </h1>
        </div>
        {action}
      </header>

      <nav aria-label="Sections" className="flex gap-1 rounded-xl bg-muted p-1">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            // `exact`, or "/" would light up on every route beneath it.
            activeOptions={{ exact: true }}
            // The full class list on each side rather than a base plus a
            // modifier: Link's own merging of `className` with these is an
            // implementation detail, and this does not depend on it.
            activeProps={{
              className: cn(
                TAB_CLASS,
                "bg-card text-foreground ring-1 ring-foreground/10",
              ),
            }}
            inactiveProps={{
              className: cn(
                TAB_CLASS,
                "text-muted-foreground hover:text-foreground",
              ),
            }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
