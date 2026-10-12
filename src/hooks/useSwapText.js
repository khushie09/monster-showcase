import { useEffect, useState } from 'react';

// Returns [shownValue, isFadingOut]. When `value` changes, the old content fades out,
// then the new content is shown.
export function useSwapText(value) {
  const [shown, setShown] = useState(value);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (value === shown) return undefined;
    setFadingOut(true);
    const t = setTimeout(() => {
      setShown(value);
      setFadingOut(false);
    }, 280);
    return () => clearTimeout(t);
    // `shown` is intentionally left out: we only react to changes of `value`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return [shown, fadingOut];
}
