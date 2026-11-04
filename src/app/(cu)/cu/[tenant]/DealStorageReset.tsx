'use client';

import { useEffect } from 'react';
import { clearDealStorage } from '@/cu/storage';

/** Credit-union pages do not keep deal data the consumer grader may have saved on this origin. */
export function DealStorageReset() {
  useEffect(() => {
    clearDealStorage(window.localStorage);
    clearDealStorage(window.sessionStorage);
  }, []);
  return null;
}
