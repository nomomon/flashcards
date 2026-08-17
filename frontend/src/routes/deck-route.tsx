import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeftIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { describeDirection } from "@/features/study/directions";
import { StudySession } from "@/features/study/study-session";
import { StudySkeleton } from "@/features/study/study-skeleton";
import { useDeck, useManifest } from "@/lib/data/queries";
import { useDeckProgress } from "@/lib/progress/queries";
import { cn } from "@/lib/utils";

const routeApi = getRouteApi("/deck");

/** The study session. Its whole configuration lives in the URL. */
export function DeckPage() {
  const { deckId, tags, direction } = routeApi.useSearch();
  const navigate = useNavigate();

  const manifest = useManifest();
  const deck = useDeck(deckId);
  const progress = useDeckProgress(deckId);

  const summary = manifest.data?.decks.find((entry) => entry.id === deckId);
  const isMissing = manifest.isSuccess && !summary;

  useEffect(() => {
    if (!isMissing) return;

    toast.error("That deck is not available", {
      description: "It may have been renamed or removed.",
    });
    void navigate({ to: "/", replace: true });
  }, [isMissing, navigate]);

  const languages = deck.data?.languages ?? summary?.languages;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="icon-lg"
          aria-label="Back to decks"
        >
          <Link to="/">
            <ChevronLeftIcon />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading truncate text-xl font-semibold">
            {deck.data?.name ?? summary?.name ?? "Deck"}
          </h1>
          {languages ? (
            <p className="text-sm text-muted-foreground">
              {describeDirection(languages, direction)}
            </p>
          ) : null}
        </div>
      </header>

      {tags && tags.length > 0 ? (
        <div className="-mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {isMissing ? (
        <StudySkeleton />
      ) : deck.isError ? (
        <DeckError
          message={
            deck.error instanceof Error
              ? deck.error.message
              : "This deck could not be loaded."
          }
          isRetrying={deck.isFetching}
          onRetry={() => void deck.refetch()}
        />
      ) : deck.data && progress.data ? (
        <StudySession
          deck={deck.data}
          progress={progress.data}
          tags={tags ?? null}
          direction={direction}
        />
      ) : (
        <StudySkeleton />
      )}
    </div>
  );
}

interface DeckErrorProps {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
}

function DeckError({ message, isRetrying, onRetry }: DeckErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <TriangleAlertIcon className="size-8 text-destructive" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">Could not load this deck</p>
        <p className="max-w-md text-sm break-words text-muted-foreground">
          {message}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          size="lg"
          className="h-11"
          disabled={isRetrying}
          onClick={onRetry}
        >
          <RefreshCwIcon className={cn(isRetrying && "animate-spin")} />
          Try again
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11">
          <Link to="/">Back to decks</Link>
        </Button>
      </div>
    </div>
  );
}
