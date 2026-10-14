import { track } from '@vercel/analytics';

/** Fires a Vercel Analytics custom event when a deal grade is returned. Never throws. */
export function trackDealGraded(props: { grade: string; dealType?: string; source: 'analyze' | 'advanced' }) {
  try {
    track('deal_graded', { grade: props.grade, dealType: props.dealType ?? 'unknown', source: props.source });
  } catch {
    /* analytics must never break the grading flow */
  }
}
