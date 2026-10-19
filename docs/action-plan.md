# Wattwise Clarity Action Plan

> Written against an earlier draft of the deck. Its numbers are superseded by `02 Scheduler Module/replay.py` and `results/replay.json` (19 October 2026).

Date: 2026-10-18 · Owner split: slides = team pastes (Canva stays view-only for the agent), dashboard + testing suite = agent builds
Source: docs/grilling-report.md (deck-grounded interrogation)

## Item 1 · Make the money agree

### Slides (team pastes; agent drafts copy)
- P8 Impact: lead with the floor case as the headline: "RM12,800-15,600/yr kept · Innovation Park alone (modelled)". Move RM45,200-55,600 to a second row labelled "with Lakeside Mall · modelled only".
- P8 price footnote: "All RM figures assume the modelled floor-price band (RM0.142-0.174/kWh), net of the 9 sen/kWh access charge."
- P4 Target users: replace "95.4% -> 98.8% paid for" with the matching pair "89.9% -> 95.8% of solar paid for" so it subtracts cleanly against P8's 10.1% -> 4.2%. Any other range must be relabelled as a different named population with a footnote.
- P7 Allocate step: mark any sen figure as "net of access charge" (or correct the number if the team says it is not net). PENDING team confirmation.
- P20 Appendix B: add the assumed price band + its source as a visible line; table becomes two rows: floor (Innovation Park) vs scenario (with Mall, modelled only).

### Admin dashboard (agent, done)
- NEDA floor mention under the allocation output now states the assumed band (RM0.142-0.174/kWh, modelled) and that the hold-back covers forecast misses first.
- Estimates step captioned with the backtest error band: typical month ±6.6%, worst 24-32%.
- Evidence-notes price line corrected from "assumed 15 to 30 sen" to the one band (14.2-17.4 sen) used everywhere.
- All "(modelled)" and "modelled from annual shares" labels rendered semi-transparent (.mod class) so honesty stays visible but not distracting.
- Allocation round panels stamped with their 120-day notice date.
- Lifecycle caption extended: "WattWise suggests · the scheme admin approves · SDP files it with the Energy Commission · 120-day notice per buyer."

### Testing suite (agent, done)
- Appendix B: floor case promoted to headline KPI; RM45k-56k relabelled "with Lakeside Mall · modelled only"; banner line "CREAM price is private · all RM at the modelled floor band RM0.142-0.174/kWh".
- View Data modal: price-assumption row added so the judge sees the constant.
- All RM figures carry the modelled tag; tags semi-transparent.

## Item 2 · Own the worst month

### Slides (team pastes)
- P19 Appendix A: add under the error stats: "Typical month error 6.6%, worst 24-32%. Wins are aggregate: the plan loses in the worst months, and the hold-back is the shock absorber."
- Optional P8 clause: "worst months covered by hold-back".

### Admin dashboard (agent, done)
- Estimates table caption carries the error band (same as item 1).
- Hold-back line states its job: covers forecast misses first.

### Testing suite (agent, done)
- Appendix A: honesty card with the error band and the win/tie/loss shape of the modelled year (9 win / 3 tie / 0 loss months), plus the 2%-of-schemes loss rate from the 1,033-scheme replay.
- Month strip shows each month's outcome (win = green bar, tie = faint bar) so "98%" is a shape, not a single number.

## Item 3 · Prove the loop is legal

### Slides (team pastes; needs the guideline first)
- References: quote GP/ST/No.55/2025 verbatim on notice duration and whether shares can be re-filed, with clause number. PENDING team.
- P3: cite the guideline itself next to the 120-day rule, not only "Skrine 2025".
- P5: replace "four months ahead" with "120 days ahead" deck-wide.
- Fallback wording only if the guideline locks shares annually: "WattWise plans the annual filing, and every settled month sharpens next year's."

### Admin dashboard (agent, done)
- Round panels carry the 120-day stamp: "notice by <date> · 120 days before <month year>".
- Lifecycle caption extended with "120-day notice per buyer".
- If the team finds an annual lock: monthly rounds relabel to "shadow suggestion feeding the annual filing" (one-line change, waiting on the clause).

### Testing suite (agent, done)
- Appendix D: compliance card added: filing cadence (one allocation per buyer per month), notice length (120 days), WattWise suggests / SDP files, source: Energy Commission (2025) CREAM Guidelines GP/ST/No.55/2025. No clause number invented; verbatim quote lands when the team supplies it.

## Items outside this pass (from the plan, still open)

- Item 4 hygiene: fix Song Hui Min / Amanda Ong Hui Min (P2 vs P12); delete empty stubs P14-18; renumber appendices A-E, References last; kill duplicate section 8 at P23; remove "Completed: 23 Oct 2026" (P13); standardize "120 days" wording. All team-side Canva edits.
- Item 5: the 20% claim needs a one-line derivation in Appendix C or softening to "room for more roofs, quantified in the pilot".
- Team dependencies blocking final numbers: (a) is any sen figure net of the access charge; (b) the GP/ST/No.55/2025 clause on re-filing cadence; (c) definition of the "fixed split" baseline; (d) any GSPARX/SDP confirmation of leakage.
