/**
 * Titles only. The packet and the terms page name these so the owner can supply them.
 * This file does not answer them.
 */
/** Blank answers in the packet and privacy page. Not a fact and not a certification. */
export const OWNER_BLANK = 'TO BE PROVIDED BY OWNER/COUNSEL';

export const OWNER_OPEN_ITEMS = [
  'Legal entity name of the provider',
  'Cyber and technology E&O insurance: carrier and limits, if any',
  'SOC 2, ISO 27001, or another independent report, if any',
  'Independent penetration test or external scan, if any',
  'Who can access production',
  'Anthropic commercial terms and DPA, including the retention window in those terms',
  'Region where Anthropic processes a worksheet request',
  'Region and retention of host platform logs',
  'Incident notice timeline to the credit union',
  'Whether the credit union can end the 90-day pilot early, and on what notice',
  'Governing law, venue, liability cap, indemnity, and warranties',
  'Subprocessor change-notice process',
  'Whether a worksheet that contains a name or VIN is nonpublic personal information under the credit union’s GLBA program',
] as const;
