import { useEffect, useState } from 'react';

// Returns `value` only after it has stopped changing for `delay` ms, e.g. to avoid filtering on every keystroke.
export function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
