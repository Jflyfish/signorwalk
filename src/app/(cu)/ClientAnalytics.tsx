'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/next';

/**
 * Analytics calls useSearchParams, which suspends while the server is still
 * rendering. That leaves an unfinished boundary in the HTML, and the client
 * sometimes hydrates a different tree (React error 418). Mounting after
 * hydration keeps the server and the first client render the same.
 */
export function ClientAnalytics() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) return null;
  return <Analytics />;
}
