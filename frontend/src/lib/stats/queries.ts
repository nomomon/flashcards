import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { StudyStats } from "@/types/stats";
import {
  addAnswer,
  addTime,
  clearStats,
  emptyStats,
  readStats,
  writeStats,
} from "./store";

/**
 * Same split as `lib/progress/queries.ts`: localStorage is the store, TanStack
 * Query is only the read/notify layer, `networkMode: "always"` because none of
 * this ever touches the network, and stats queries are not persisted by the
 * query persister - localStorage already owns them.
 */

export const statsKeys = {
  all: ["stats"] as const,
};

export function useStats(): UseQueryResult<StudyStats> {
  return useQuery({
    queryKey: statsKeys.all,
    queryFn: readStats,
    initialData: readStats,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    networkMode: "always",
  });
}

/**
 * Read-modify-write against the cache, falling back to storage. Synchronous,
 * like the progress mutations, so rapid successive answers compose instead of
 * racing each other back to the same day bucket.
 */
function useStatsMutation<TVariables>(
  apply: (stats: StudyStats, variables: TVariables) => StudyStats,
): UseMutationResult<StudyStats, Error, TVariables> {
  const queryClient = useQueryClient();

  return useMutation<StudyStats, Error, TVariables>({
    networkMode: "always",
    mutationFn: async (variables) => {
      const current =
        queryClient.getQueryData<StudyStats>(statsKeys.all) ?? readStats();
      const next = apply(current, variables);
      // `addTime` returns the same object for a no-op write, and re-writing
      // then would touch localStorage on every idle tick for nothing.
      if (next === current) return current;
      writeStats(next);
      queryClient.setQueryData(statsKeys.all, next);
      return next;
    },
  });
}

/** One verdict, for today. What word it was about is not recorded. */
export function useRecordAnswer(): UseMutationResult<
  StudyStats,
  Error,
  { known: boolean }
> {
  return useStatsMutation((stats, { known }) => addAnswer(stats, known));
}

export function useRecordTime(): UseMutationResult<
  StudyStats,
  Error,
  { ms: number }
> {
  return useStatsMutation((stats, { ms }) => addTime(stats, ms));
}

export function useResetStats(): UseMutationResult<StudyStats, Error, void> {
  const queryClient = useQueryClient();

  return useMutation<StudyStats, Error, void>({
    networkMode: "always",
    mutationFn: async () => {
      clearStats();
      const empty = emptyStats();
      queryClient.setQueryData(statsKeys.all, empty);
      return empty;
    },
  });
}
