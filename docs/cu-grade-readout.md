# Credit-union grade readout copy

Draft only. These sentences are on the member grade screen or on a printed copy of it. A credit union and its counsel still have to review them before a member sees a production page. This note does not say that any regulator has approved the wording.

Shown once, under the grade and the verdict, above the rows:

- `This is not a loan offer.`
- `{credit union short name} does not endorse the dealer.`
- `This grade is educational.`

Shown under the pre-approval button, and as a 12px line in the pinned mobile bar:

- `Not an offer of credit.`

Those are the only disclaimer lines. See details does not repeat the engine disclaimer block. How we grade does not say "It is not a loan offer."

Shown on a printed copy, and not as a claim about a statute:

- `Not financial advice.`

The printed loan link is the absolute pre-approval URL with `utm_*` parameters removed. "Based on N figures" prints in `#555`. "See auto rates" and its Demo pill do not print.

The letter and the words Strong, Fair, and Weak describe the offer. They do not describe the member's credit.

## APR grading cutoffs

`src/cu/engine/evaluate.ts` lines 142–147 score a finance APR with four comparisons on `input.apr` only:

```
if (input.apr > 10) FLAG_APR_VERY_HIGH
else if (input.apr > 8) FLAG_APR_HIGH
else if (input.apr > 0 && input.apr <= 6) APR_STRONG (+10)
else if (input.apr <= 8) APR_TYPICAL (+3)
```

What the 6–8 band does: an APR above 6 and up to 8 does not get `APR_STRONG`. It gets `APR_TYPICAL`, a smaller positive adjustment (`delta: 3`). It is not flagged. It is not listed as something to ask about. The readout says it does not earn the strong-rate credit.

- An APR at or under 6 gets the stronger score (`APR_STRONG`).
- An APR above 8 and up to 10 is flagged (`FLAG_APR_HIGH`).
- An APR above 10 is flagged further (`FLAG_APR_VERY_HIGH`).

`src/cu/engine/report.ts` lines 198–202 repeat those same literals when it labels the APR row. `EngineInput` in `src/cu/engine/types.ts` has no credit score, credit tier, or FICO field. The comparisons do not read one. They are the same for every member.

Those numbers are literals inside the functions. The engine does not export them. The readout discovers the boundaries by running `evaluateDeal` and states them with one decimal (`6.0%`, `8.0%`, `10.0%`). It does not describe them as a market rate or an offer of credit.

See details uses that same cutoff line for the APR row. Sentences about a typical band, an often-cited range, a rough 6–8% range, or a benchmark are removed from the details text on screen and in print.

## Open item

`dealerQuestions` can append a credit-union APR when a caller passes one (`What APR can you offer if I bring my own financing at {rate}%?`). No tenant has a rate field, so the member page never passes one and that sentence cannot fire. The argument stays until a tenant can store a rate.
