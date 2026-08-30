import { TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface ResetProgressButtonProps {
  isResetting: boolean;
  onReset: () => void;
  label?: string;
  armedLabel?: string;
}

/** How long an armed button stays armed before it forgets it was tapped. */
const ARMED_MS = 5000;

/**
 * Wiping every verdict in a deck is one tap away from a fat finger, so the
 * button arms first and resets second. Two taps rather than a modal: there is no
 * dialog primitive in this app yet, and a confirmation step that lives in the
 * button itself needs no focus trap, no scroll lock and no second component.
 *
 * The labels are props so the stats page can reuse the arming behaviour for
 * erasing its own record. What is being wiped changes; needing two taps to wipe
 * it does not.
 */
export function ResetProgressButton({
  isResetting,
  onReset,
  label = "Reset progress",
  armedLabel = "Tap again to erase progress",
}: ResetProgressButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;

    const timer = window.setTimeout(() => setArmed(false), ARMED_MS);
    return () => window.clearTimeout(timer);
  }, [armed]);

  const handleClick = () => {
    if (!armed) {
      setArmed(true);
      return;
    }

    setArmed(false);
    onReset();
  };

  return (
    <Button
      variant={armed ? "destructive" : "ghost"}
      size="lg"
      className="h-11 self-center text-muted-foreground data-[variant=destructive]:text-destructive"
      disabled={isResetting}
      onClick={handleClick}
    >
      <TrashIcon />
      {armed ? armedLabel : label}
    </Button>
  );
}
