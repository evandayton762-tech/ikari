// app/components/ClientOnly.jsx
import { useEffect, useState } from 'react';

export function ClientOnly({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return typeof children === 'function' ? children() : children;
}