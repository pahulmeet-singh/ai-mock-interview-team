import { useEffect, useRef } from 'react';

// Subscribes to a DOM event for the lifetime of the component. The handler is kept in a ref so callers can pass
// a fresh function every render without re-subscribing.
export function useEventListener(type, handler, target = typeof window === 'undefined' ? null : window) {
  const saved = useRef(handler);
  useEffect(() => {
    saved.current = handler;
  });
  useEffect(() => {
    if (!target?.addEventListener) return undefined;
    const listener = (event) => saved.current(event);
    target.addEventListener(type, listener);
    return () => target.removeEventListener(type, listener);
  }, [type, target]);
}
