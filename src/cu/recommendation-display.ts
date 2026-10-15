import type { Recommendation } from '@/cu/engine/types';

/** Shown instead of a sign recommendation when the finance grade is not final. */
export const ADD_APR_RECOMMENDATION = 'Add APR for a full recommendation';

/**
 * Display-only. Blank APR, or a report that still says the rate is missing,
 * is a provisional finance grade. Limited data with an APR entered is not.
 * This does not change the engine recommendation.
 */
export function financeGradeIsProvisional(
  report: { notes: { id: string }[] },
  aprBlank: boolean,
): boolean {
  return aprBlank || report.notes.some(note => note.id === 'rate-missing');
}

/** UI caption. Negotiate and walk labels stay as the engine wrote them. */
export function memberRecommendationLine(input: {
  recommendation: Recommendation;
  recommendationLabel: string;
  grade: string;
  aprBlank: boolean;
  provisional: boolean;
}): string {
  if (input.recommendation === 'sign' && (input.aprBlank || input.provisional)) {
    return ADD_APR_RECOMMENDATION;
  }
  if (input.grade === 'A' || input.recommendation !== 'sign') return input.recommendationLabel;
  return '';
}
