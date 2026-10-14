import { track } from '@vercel/analytics';
import type { Archetype, Grade } from '@/lib/engine/types';
import { ARCHETYPES, GRADES } from '@/lib/engine/types';
import type { TenantId } from '@/tenants/types';

export const ANALYSIS_EVENT = 'analysis_completed' as const;
export const CTA_EVENT = 'cta_clicked' as const;

export const CTA_TARGETS = ['preapproval', 'rates'] as const;
export type CtaTarget = (typeof CTA_TARGETS)[number];

export type CuTenantId = Exclude<TenantId, 'sow'>;

export const CU_TENANT_IDS = ['harborlight-cu', 'summit-ridge-fcu'] as const satisfies readonly CuTenantId[];

const GRADE_SET = new Set<string>(GRADES);
const ARCHETYPE_SET = new Set<string>(ARCHETYPES);
const TENANT_SET = new Set<string>(CU_TENANT_IDS);
const CTA_SET = new Set<string>(CTA_TARGETS);

/** Aggregate event. Properties are closed enums: no amounts, vehicle, or free text. */
export function trackAnalysisCompleted(props: {
  tenant: CuTenantId;
  grade: Grade;
  dealType: 'lease' | 'finance';
  archetype: Archetype;
}) {
  if (!TENANT_SET.has(props.tenant) || !GRADE_SET.has(props.grade) || !ARCHETYPE_SET.has(props.archetype)) return;
  if (props.dealType !== 'lease' && props.dealType !== 'finance') return;
  try {
    track(ANALYSIS_EVENT, {
      tenant: props.tenant,
      grade: props.grade,
      dealType: props.dealType,
      archetype: props.archetype,
    });
  } catch {
    /* analytics must never break grading */
  }
}

export function trackCtaClicked(props: { tenant: CuTenantId; target: CtaTarget }) {
  if (!TENANT_SET.has(props.tenant) || !CTA_SET.has(props.target)) return;
  try {
    track(CTA_EVENT, { tenant: props.tenant, target: props.target });
  } catch {
    /* analytics must never break navigation */
  }
}
