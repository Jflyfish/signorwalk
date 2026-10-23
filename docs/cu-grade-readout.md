# Credit-union grade readout copy

Draft only. These sentences are on the member grade screen or on a printed copy of it. A credit union and its counsel still have to review them before a member sees a production page. This note does not say that any regulator has approved the wording.

Shown once, under the grade and the verdict, above the rows:

- `This is not a loan offer.`
- `{credit union short name} does not endorse the dealer.`
- `This grade is educational.`

Shown under the pre-approval button:

- `Not an offer of credit.`

Shown on a printed copy, and not as a claim about a statute:

- `Not financial advice.`

The letter and the words Strong, Fair, and Weak describe the offer. They do not describe the member's credit.

## APR grading cutoffs

`src/cu/engine/evaluate.ts` lines 142–146 score a finance APR with three comparisons on `input.apr` only:

- `input.apr > 0 && input.apr <= 6` adds the stronger score adjustment `APR_STRONG`
- `input.apr > 8` raises `FLAG_APR_HIGH`
- `input.apr > 10` raises `FLAG_APR_VERY_HIGH`

`src/cu/engine/report.ts` lines 198–202 repeat those same literals when it labels the APR row. `EngineInput` in `src/cu/engine/types.ts` has no credit score, credit tier, or FICO field. The comparisons do not read one. They are the same for every member.

Those numbers are literals inside the functions. The engine does not export a single APR constant. The readout discovers the three boundaries by running `evaluateDeal` and states all three. It does not describe them as one threshold, a market rate, or an offer of credit.
