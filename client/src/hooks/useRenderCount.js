import { useEffect, useRef } from 'react';

// Development-only: logs how many times a component has rendered. Wrap a component in React.memo, rerender its
// parent, and watch the count stop climbing. Used in the viva to show what memoisation actually does.
export function useRenderCount(name) {
  const count = useRef(0);
  useEffect(() => {
    count.current += 1;
    if (import.meta.env.DEV) console.debug(`[render] ${name} #${count.current}`);
  });
}
