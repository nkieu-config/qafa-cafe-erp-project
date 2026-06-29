import { useEffect, useState } from "react";

const DEFAULT_TICK_MS = 30_000;

/** Ticks on an interval so KDS wait labels and urgency colors stay current. */
export function useKdsWaitClock(intervalMs = DEFAULT_TICK_MS): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
