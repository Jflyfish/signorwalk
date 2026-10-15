/** Visible credit-union copy that more than one page has to match. */

export const PILOT_MARK = 'Pilot-only, pending counsel review';

/** Facts this build can support. Not a promise about Anthropic's contract. */
export const AI_FACTS = [
  'A worksheet may include a name and VIN. It is sent to Anthropic for that request so the numbers can be read. This application does not store the file.',
  'Anthropic’s DPA, region, and retention are not stated here. They are in the due-diligence packet as items the owner and counsel still have to supply.',
  'The grade comes from rules in this application. A model does not write the sentences a member reads.',
] as const;

/** Marketing page for the draft packet. Not a certification. */
export const DUE_DILIGENCE_PACKET_HREF = '/credit-unions/packet';

export const UPLOAD_DISCLOSURE_LEAD =
  'A worksheet may include a name and VIN. It is sent to Anthropic to read the numbers for this check. We don’t store it. The ';
export const UPLOAD_DISCLOSURE_LINK = 'due-diligence packet';
export const UPLOAD_DISCLOSURE_TAIL = ' has the open items.';

export const UPLOAD_DISCLOSURE = `${UPLOAD_DISCLOSURE_LEAD}${UPLOAD_DISCLOSURE_LINK}${UPLOAD_DISCLOSURE_TAIL}`;

export const FILE_READ_ERROR = "We couldn't read that file. Enter the numbers instead.";
