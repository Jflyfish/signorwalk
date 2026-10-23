# Credit-union grade readout copy

Draft only. These sentences are on the member grade screen or on a printed copy of it. A credit union and its counsel still have to review them before a member sees a production page. This note does not say that any regulator has approved the wording.

Shown once, under the grade and the verdict, above the rows. Four lines, in this order:

- `This grade doesn't look at your credit history or score.`
- `Grades never use age, race, sex, ZIP code, or other personal characteristics.`
- `Confirm every figure on the dealer's written worksheet before you agree to anything.`
- `This grade is educational. This is not a loan offer.`

The block does not say the grade estimates credit standing, and it does not say "benchmarks" or "labeled assumptions". An incomplete grade, before any verdict, shows only the shortest of these lines.

`EngineInput` has no credit-history, credit-score, age, race, sex, or ZIP field. It does have an optional `state` code. `evaluateDeal` does not read `state`. `report.ts` uses it only for a tax note. The two sentences above are also in How we grade, once each, and once each in the due-diligence questionnaire. They are not repeated under See details. This note does not say a regulator approved them.

Shown under the inline pre-approval button and inside the pinned bar:

- `Not an offer of credit.`

The inline button reads `Check your rate with {short name}`. The pinned bar reads `Check your rate`, with no credit-union name, and stays at 64px plus the safe area. It appears only after the inline button has scrolled above the viewport, and it stays hidden while it would cover the rows or the questions. The Demo pill is limited to seeded demo tenants and the sample grade. See details does not repeat the disclaimer block. How we grade does not say "It is not a loan offer." When the price equals MSRP, the price row says `at MSRP`.

Shown on a printed copy, and not as a claim about a statute:

- `Not financial advice.`

The printed loan link is the absolute pre-approval URL with `utm_*` parameters removed. "Based on N figures you entered" does not print. "See auto rates" and its Demo pill do not print.

The letter and the words Strong, Fair, and Weak describe the offer. They do not describe the member's credit.

## APR grading cutoffs

`src/cu/engine/evaluate.ts` lines 142–147 score a finance APR with four comparisons on `input.apr` only:

```
if (input.apr > 10) FLAG_APR_VERY_HIGH
else if (input.apr > 8) FLAG_APR_HIGH
else if (input.apr > 0 && input.apr <= 6) APR_STRONG (+10)
else if (input.apr <= 8) APR_TYPICAL (+3)
```

What the 6–8 band does: an APR above 6 and up to 8 does not get `APR_STRONG`. It gets `APR_TYPICAL`, a smaller positive adjustment (`delta: 3`). It is not flagged. It is not listed as something to ask about. The readout why line says `between 6.0% and 8.0%: not flagged`, using the cutoffs read from the engine, with a neutral marker rather than a helped check. The qualifier `(not a market rate or an offer)` stays on that line.

- An APR at or under 6 gets the stronger score (`APR_STRONG`).
- An APR above 8 and up to 10 is flagged (`FLAG_APR_HIGH`).
- An APR above 10 is flagged further (`FLAG_APR_VERY_HIGH`).

`src/cu/engine/report.ts` lines 198–202 repeat those same literals when it labels the APR row. `EngineInput` in `src/cu/engine/types.ts` has no credit score, credit tier, or FICO field. The comparisons do not read one. They are the same for every member.

Those numbers are literals inside the functions. The engine does not export them. The readout discovers the boundaries by running `evaluateDeal` and states them with one decimal (`6.0%`, `8.0%`, `10.0%`). It does not describe them as a market rate or an offer of credit.

See details writes a full sentence from the engine figure and the cutoff, for example `Term is 72 months, at or above this tool's 72-month line.` and `Price is $1,500 over the MSRP of $35,000.` An APR in the middle band reads `between 6.0% and 8.0% and is not flagged`. Sentences about a typical band, an often-cited range, a rough 6–8% range, or a benchmark are removed from the details text on screen and in print.

## Open item

`dealerQuestions` can append a credit-union APR when a caller passes one (`What APR can you offer if I bring my own financing at {rate}%?`). No tenant has a rate field, so the member page never passes one and that sentence cannot fire. The argument stays until a tenant can store a rate.
