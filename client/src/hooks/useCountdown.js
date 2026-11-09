import { useEffect, useState } from 'react';

// A clock that re-renders its component every `intervalMs`. The effect's cleanup stops the timer when the
// component unmounts, so no interval is ever left running.
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// Milliseconds left until an ISO timestamp (never negative; 0 when there is no target yet).
export function useCountdown(targetIso, intervalMs = 1000) {
  const now = useNow(intervalMs);
  return targetIso ? Math.max(0, new Date(targetIso).getTime() - now) : 0;
}
