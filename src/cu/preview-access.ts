import { cookies } from 'next/headers';
import { canOpenTenant, CU_SESSION_COOKIE, verifySession } from './auth';

/** The signed-in owner may grade a draft page. A public request stays blocked. */
export async function staffCanPreview(tenantId: string): Promise<boolean> {
  try {
    const jar = await cookies();
    return canOpenTenant(verifySession(jar.get(CU_SESSION_COOKIE)?.value), tenantId);
  } catch {
    return false;
  }
}
