import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { z } from "zod";

import {
  DEFAULT_STUDY_DIRECTION,
  STUDY_DIRECTIONS,
} from "@/features/study/directions";
import { DeckPage } from "@/routes/deck-route";
import { OverviewPage } from "@/routes/index-route";
import { NotFoundPage, RootLayout, RouteErrorPage } from "@/routes/root-layout";

/**
 * Tags normally travel as a JSON array (`?tags=["a","b"]`), but a hand-typed
 * `?tags=a,b` is accepted too. Anything else falls back to "all tags".
 */
const tagsSchema = z
  .union([z.array(z.string()), z.string().transform((raw) => raw.split(","))])
  .transform((tags) => tags.map((tag) => tag.trim()).filter(Boolean))
  .transform((tags) => (tags.length > 0 ? tags : undefined))
  .optional()
  .catch(undefined);

/**
 * Every field has its own `.catch(...)`, so a truncated or hand-edited URL
 * degrades to a typed default instead of throwing during render.
 */
const deckSearchSchema = z.object({
  deckId: z.string().catch(""),
  tags: tagsSchema,
  direction: z.enum(STUDY_DIRECTIONS).catch(DEFAULT_STUDY_DIRECTION),
});

export type DeckSearch = z.output<typeof deckSearchSchema>;

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

const deckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/deck",
  validateSearch: (search: Record<string, unknown>): DeckSearch =>
    deckSearchSchema.parse(search),
  component: DeckPage,
});

const routeTree = rootRoute.addChildren([indexRoute, deckRoute]);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: RouteErrorPage,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
