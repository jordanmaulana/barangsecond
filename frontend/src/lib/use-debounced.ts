import { useEffect, useState } from "react";

/** Returns `value` delayed by `delay` ms — useful to throttle search-as-you-type
 * before it drives a server request / query key. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
