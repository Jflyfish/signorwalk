/** Visible credit-union copy that more than one page has to match. */

export const PILOT_MARK = 'Pilot-only, pending counsel review';

/** Facts this build can support. Not a promise about Anthropic's contract. */
export const AI_FACTS = [
  'A worksheet image or PDF leaves the credit union’s control. It is sent to Anthropic for that request so the numbers can be read.',
  'Anthropic is the processor. How long Anthropic keeps the request, and in which region, follows Anthropic’s current terms. This pilot does not use zero data retention.',
  'A worksheet may include a member name and VIN.',
  'This application does not store the worksheet or the numbers from it. The grade comes from rules in this application. A model does not write the sentences a member reads.',
] as const;

export const UPLOAD_DISCLOSURE = AI_FACTS.join(' ');

export const FILE_READ_ERROR = "We couldn't read that file. Enter the numbers instead.";
