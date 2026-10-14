/** Deal keys written by the consumer grader. Credit-union pages remove them and never write them. */
export const DEAL_STORAGE_KEYS = ['sow_session', 'sow_quote_b64', 'sow_prefill'] as const;

export function clearDealStorage(storage: { removeItem(key: string): void } | null | undefined): void {
  if (!storage) return;
  for (const key of DEAL_STORAGE_KEYS) {
    try {
      storage.removeItem(key);
    } catch {
      /* Storage can throw in private mode. Grading does not depend on it. */
    }
  }
}
