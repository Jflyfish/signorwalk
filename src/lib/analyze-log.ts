/** Keys allowed on the structured analyze log. Inputs, vehicle, IP, and user agent are not included. */
export const ANALYZE_LOG_KEYS = [
  'ts',
  'tenant',
  'route',
  'schemaVersion',
  'templatePack',
  'grade',
  'flagIds',
  'archetype',
  'fallbackUsed',
  'latencyMs',
  'outcome',
] as const;

export type AnalyzeLogKey = (typeof ANALYZE_LOG_KEYS)[number];

export interface AnalyzeLog {
  ts: string;
  tenant: string;
  route: '/api/analyze';
  schemaVersion: '1';
  templatePack?: string;
  grade?: string;
  flagIds?: string[];
  archetype?: string;
  fallbackUsed?: boolean;
  latencyMs: number;
  outcome: 'ok' | 'invalid' | 'error';
}

export function formatAnalyzeLog(entry: AnalyzeLog): string {
  const out: Record<string, unknown> = {};
  for (const key of ANALYZE_LOG_KEYS) {
    if (entry[key] !== undefined) out[key] = entry[key];
  }
  return JSON.stringify(out);
}
