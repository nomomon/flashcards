import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

/**
 * Service worker registration, and the one piece of UI it needs.
 *
 * The worker is registered with `registerType: "prompt"`, so a new version waits
 * instead of taking over. That matters here: an automatic update reloads the
 * page, and doing that to someone part-way through a deck throws away the cards
 * they were looking at. Progress itself is safe in localStorage, but the session
 * is not, so the app asks.
 *
 * The ask is a toast rather than a banner because there is already a toaster
 * mounted, and because an update is worth noticing but never urgent.
 */
export function registerServiceWorker(): void {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast("A new version is available", {
        // No auto-dismiss: this one is actionable, and a toast that vanishes is
        // an update the learner can no longer choose.
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: "Reload",
          // `true` reloads once the new worker has taken control.
          onClick: () => void updateSW(true),
        },
      });
    },
    onOfflineReady() {
      toast.success("Ready to use offline", {
        description: "Decks you have opened stay available without a network.",
      });
    },
  });
}
