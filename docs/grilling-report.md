# Wattwise Grilling Report (deck-grounded, read-only)

> Written against an earlier draft of the deck. Its numbers are superseded by `02 Scheduler Module/replay.py` and `results/replay.json` (19 October 2026).

Date: 2026-10-18 · Method: grill-me / grilling design-tree interrogation, run by a subagent
Grounding: every Wattwise fact below comes ONLY from the pitch deck at https://canva.link/z333e2xxkgxke5e (23 pages, extracted read-only). Nothing from the repo, Notes, or elsewhere. No files were edited anywhere.

## The subagent's thoughts

**Strengths:** Wattwise is built on a real, sharp regulatory insight: CREAM's 120-day pre-filing rule forces allocations before demand is known, and over-allocated solar goes to the grid unpaid while the 9 sen/kWh access charge still bites (P3). That is a genuinely good wedge. Validation is above hackathon average: 590 buildings, 4-month planning gap, wins vs fixed and naive-copy baselines (P9), win rates 98%/88% across 443 two-buyer schemes (P19). Runnable prototype with public repo and testing guide (P11), an empty dynamic-allocation quadrant in the competitive map (P6), and a no-gain-no-fee model (P10) that prices adoption risk to zero for SDP.

**What a hostile judge attacks first:**

1. **Arithmetic coherence.** "95.4% to 98.8% paid for" (P4) vs "10.1% down to 4.2% giveaway" (P8): 100-4.2=95.8 and 100-10.1=89.9, so the paid-range only touches the giveaway number at its very edge, and the 89.9% baseline appears nowhere on P4. Three energy prices coexist: 8 sen/kWh hold-back sale (P7), 9 sen/kWh access charge (P3), and ~14.2-17.3 sen/kWh implied by Appendix B (RM12,800-15,600 for 90 MWh, P20). They cannot all describe the same economics, and if you sell hold-back at 8 sen while paying a 9 sen charge, you LOSE 1 sen/kWh on every held-back kWh.
2. **Headline revenue rests on a fictional buyer.** RM45,200-55,600/yr (P8) is 3-4x the floor case RM12,800-15,600 (P20), and the gap is "Lakeside Mall... a second buyer in our model only" (P20), with "the CREAM price is private" (P20). Every RM figure multiplies an undisclosed constant times a hypothetical buyer.
3. **Worst case beats the baseline.** Typical estimate error 6.6% but worst month 24-32% (P19): the worst-month error is 2.4-3.2x the entire 10.1% giveaway the product exists to fix. In bad months Wattwise can give away MORE than the fixed split it attacks.
4. **Regulatory load-bearing wall unverified.** Can splits be re-filed monthly at all under GP/ST/No.55/2025 (P22), or does one 120-day notice lock a share for a year? The whole ESTIMATE-ALLOCATE-LEARN loop (P5) assumes monthly filing is lawful.
5. **Deck hygiene.** "Song Hui Min" (P2) vs "Amanda Ong Hui Min" (P12); five empty appendix stubs (P14-18) duplicating a filled set (P19-22); "Why we should win" twice and out of order (P12, P23); "Completed: 23 Oct 2026" (P13) on an obviously unfinished artifact. Judges read deck sloppiness as model sloppiness.

**Net:** strong wedge, strong evidence instinct, but the money story and the legality story are each one subtraction or one guideline citation away from collapsing in front of a judge.

## Dashboard report

Tree: Root = replace fixed yearly allocation with forecast-led monthly filings. Branches: A problem validity, B solution mechanics, C economics, D adoption, E moat, F integrity.

### ROUND 1: PROBLEM FRONTIER
- Q1.1 Verbatim rule? Is the 120-day written-notice-per-share rule (P3, Skrine 2025) quoted verbatim from GP/ST/No.55/2025 (P22) in Appendix E? -> Yes: paste the exact clause. If no: the premise is a secondary citation; the wedge itself is unverified and everything downstream is moot.
- Q1.2 Giveaway mechanics real? Does excess solar truly flow to the grid unpaid while the 9 sen/kWh access charge still applies (P3)? -> Yes: cite the CREAM commercial terms. If no: "giveaway" shrinks to a rounding issue and impact (P8) evaporates.
- Q1.3 Baseline measured or modelled? Is 10.1% (P8) measured on real Elmina data or modelled from "Malaysia-like climates" (P8)? -> Yes: measured, show the split. If no: the 10.1->4.2 claim is a simulation fighting a simulation.
- Q1.4 Operator confirmation? Has anyone at SDP/GSPARX/Elmina confirmed the leakage in operations? -> Yes: one operator quote or anonymized bill line. If no: first judge question is "did you talk to GSPARX?" and the answer is silence.

### ROUND 2: SOLUTION MECHANICS
- Q2.1 Monthly re-filing lawful? Can CREAM splits legally be re-filed monthly, or does one filing lock a share for a year? -> Yes: monthly per-buyer filings each on 120-day notice are permitted; show the clause. If no: the "evidence-based monthly plan" (P5) is non-compliant; LEARN loses its filing function and the product degrades to an annual planner.
- Q2.2 Four months = 120 days? Is "four months ahead" (P5) exactly 120 days (P3, P7)? -> Yes: standardize on "120 days" deck-wide. If no: filings are structurally late or the deck misleads on its core number.
- Q2.3 Leakage guard in production? Does the estimator see only pre-release-date data in production, as promised (P7)? -> Yes: enforce and demo it. If no: the validation (P19) is contaminated and every percentage is inflated.
- Q2.4 Does ALLOCATE lose money? Can hold-back be "sold off at 8 sen/kWh" (P7) when the access charge is 9 sen/kWh (P3)? -> Fix: state 8 sen as NET margin after the charge, or correct the number. If no: ALLOCATE destroys value at exactly the volumes the product creates.
- Q2.5 Estimator nameable? Is it statable in one sentence (P5)? -> Yes: name it (damped seasonal-naive + trend) and say why not fancier. If no: black box; the 6.6% error (P19) has no home and "why not ML" goes unanswered.

### ROUND 3: ECONOMICS
- Q3.1 P4 vs P8 populations. Do "95.4-98.8% paid" (P4) and "10.1->4.2%" (P8) describe the same population? -> Yes: label P4 as all-buildings range, P8 as two-buyer mean, explicitly. If no: a judge subtracts live on the impact slide and both numbers die together.
- Q3.2 Headline vs floor. Does RM45,200-55,600/yr (P8) reconcile with floor RM12,800-15,600/yr (P20) plus the modelled-only Mall? At P20's implied price the headline needs ~261-391 MWh kept vs the floor's 90. -> Yes: re-present floor as headline, Mall as labelled upside. If no: the flagship number is built on a buyer the deck admits is fictional.
- Q3.3 One price basis? 8 sen (P7), 9 sen (P3), ~14-17 sen implied (P20): consistent? -> Yes: one price table carried through. If no: any numerate judge finds one within five minutes.
- Q3.4 Is 30% a business at floor scale? 0.3 x RM12,800-15,600 = RM3,840-4,680/yr per scheme (P10, P20). -> Yes: acknowledge thin per-scheme economics; the case is network scale (P10) x 20% more contributors (P8). If no: unit economics clear no procurement threshold; SDP declines after the free pilot.
- Q3.5 Where does 20% come from? Derived from the 5.9-point giveaway headroom? -> Yes: one-line derivation in Appendix C. If no: 20% is asserted; the appendix meant to evidence it (P14) is an EMPTY STUB while P21 offers screenshots, pictures, not capacity math.

### ROUND 4: ADOPTION PATH
- Q4.1 Will SDP hand over the 3 files? (P10) -> Yes: name the data owner and formats in a pilot one-pager. If no: rollout step 01 never starts.
- Q4.2 Who files? Wattwise or SDP (P10: "WattWise suggests; SDP still files")? -> Yes: SDP files, Wattwise stays decision-support. If no: Wattwise owns liability for misfiled notices, a risk a 4-person student team cannot underwrite.
- Q4.3 Day-one report realistic? "First shadow report within a day" (P10) on messy 6,000-home CSVs (P9)? -> Yes: scope day-one to Innovation Park only. If no: the promise breaks in week one and takes trust with it.
- Q4.4 Who eats a 24-32% miss? When the forecast is wrong (P19 worst month) and the share is locked 120 days (P3)? -> Yes: hold-back covers buyer shortfall first, priority written into the pilot. If no: buyers are under-allocated for four more months with no relief valve, the exact rigidity Wattwise criticizes, reproduced.
- Q4.5 Can LEARN matter? When every filing is locked 120 days out? -> Yes: each cycle improves the NEXT filing. If no: LEARN is branding; the estimator never converges.

### ROUND 5: MOAT
- Q5.1 Absorbable in a sprint? Can GSPARX or SDP build this, given nobody occupies the quadrant (P6)? -> Yes: moat = validated estimator on 590 buildings + first-mover on CREAM filings; say it aloud. If no: "why won't GSPARX ship this next quarter?" goes unanswered.
- Q5.2 Is the scope table fair? Does Bright Energy truly exclude allocation (P6)? -> Yes: verify their product surface, cite it. If no: the empty quadrant closes and the differentiation slide collapses.
- Q5.3 ESG overreach? Wattwise reallocates fixed solar, adds none; P9 ties it to Scope 2 = 19,290 tCO2e. -> Yes: reframe as economic health -> 20% more roofs -> added capacity (P8), no direct tCO2e claim. If no: judge notes generation is unchanged; the ESG bullet becomes a liability.

### ROUND 6: TEAM & DECK INTEGRITY
- Q6.1 Name consistency (P2 vs P12)? -> Fix before judging. If no: same person, two names, on a 4-person team; judges extrapolate the sloppiness to the model.
- Q6.2 Appendix chaos (empty stubs P14-18, duplicated P12/P23)? -> Fix: one appendix set A-E, References last. If no: "Completed: 23 Oct 2026" (P13) on an unfinished deck reads as poor QA, from a team whose lead claims QA (P2).
- Q6.3 Five-minute unattended run? Can a judge run ttc-099/Wattwise + Testing Guide (P11) in under 5 minutes? -> Yes: test on a clean machine. If no: "working prototype" (P9) is unverifiable and Feasibility loses its anchor.

**Most dangerous unanswered question (dashboard):** Can CREAM buyer shares be lawfully re-filed every month under GP/ST/No.55/2025, or does the 120-day notice lock each share such that a "monthly plan" (P5) is non-compliant? If the lock is annual, the core loop is illegal as designed and every downstream number is moot.

## Testing suite report

Tree: Root = "Rigorously validated" (P9) via a 590-building backtest. Branches: A data provenance, B backtest method, C results coherence, D derived-claim testing, E reproducibility.

### ROUND 1: DATA PROVENANCE
- Q1.1 590 vs 443: same dataset, nested, or disjoint (P9, P19)? -> Yes: state the nesting and source. If no: two headline sample sizes float unconnected; cherry-picking suspicion.
- Q1.2 Malaysian? Or "Malaysia-like climates" (P8)? -> Yes: state the country mix. If no: external validity to Elmina unproven; "Malaysia-like" is doing all the load-bearing work.
- Q1.3 Real solar curves? Does the backtest use real solar output (third CSV per P7) or synthetic? -> Yes: real or NSRDB-derived, disclosed. If no: giveaway depends on solar-consumption overlap; synthetic sun mismeasures the exact quantity claimed (P8).
- Q1.4 Same gap? Is the "4-month planning gap" (P9) exactly the production 120-day gap (P3, P7)? -> Yes: identical, stated. If no: the validation covers a different regime than deployment.

### ROUND 2: BACKTEST METHOD
- Q2.1 Same code as production? Same commit, leakage-guard active (P7)? -> Yes: pin the commit in the Testing Guide. If no: the prototype is validated, not the product.
- Q2.2 Strawman baseline? Is "fixed split" the buyer's historical mean or a dumb default (P9, P19)? -> Yes: define precisely, beat the strong version. If no: the 98% win rate inflates by beating a weak opponent.
- Q2.3 Undefined percentage? Is "less giveaway in 98% of 443 schemes" (P19) per scheme-month or -year, kWh or RM, at which price? -> Yes: per scheme, in RM, at the stated price. If no: the headline is undefined; aggregation choice can flip it.
- Q2.4 Does Wattwise ever lose? Worst-month error 24-32% (P19) vs baseline giveaway 10.1% (P8): in worst months does Wattwise give away MORE than fixed? -> Yes: admit it honestly, wins are aggregate, tail months are losses, show the histogram. If no ("never worse"): contradicted by the deck's own 88% figure (P19); internal inconsistency exposed under cross-examination.

### ROUND 3: RESULTS COHERENCE
- Q3.1 P4 vs P8 same run? 100-4.2=95.8 grazes the bottom of 95.4-98.8 (P4, P8). -> Yes: label populations, align to one number. If no: two impact slides disagree by simple subtraction, the deck performs the attack on itself.
- Q3.2 Mean hides tail? Is 4.2% (P8) a mean hiding the 24-32% error tail (P19)? -> Yes: report the monthly giveaway distribution. If no: the promise buyers actually experience, monthly statements (P5), meets the tail, not the mean.
- Q3.3 Hidden price. P20 implies 14.2-17.3 sen/kWh while "the CREAM price is private" (P20). Source? -> Yes: publish the assumed band and source. If no: every RM figure multiplies an undisclosed constant; the evidence appendix is a spreadsheet with a hidden input cell.
- Q3.4 Does the appendix refute the headline? RM45,200-55,600 (P8) vs floor + modelled-only Mall (P20)? -> Yes: table it as floor vs scenario. If no: the appendix written to support the headline refutes it instead, the worst possible failure mode.
- Q3.5 20% derived anywhere? -> Yes: one derivation line in Appendix C. If no: "space for 20% more contributors" is decorative.

### ROUND 4: REPRODUCIBILITY
- Q4.1 Reproducible? Can a third party reproduce 98%/88% (P19) from ttc-099/Wattwise (P11): data shipped, seeds fixed, one command? -> Yes: bundle a 50-scheme subset + seed + run script. If no: "rigorously validated" (P9) is unverifiable; the strongest asset becomes the softest.
- Q4.2 Messy inputs? Does the 3-CSV contract survive missing months, billing-cycle quirks, unit traps (P9)? -> Yes: input-validation tests in the guide. If no: "instantly output optimized allocations" dies on the first real Elmina file, taking the day-one promise (P10) with it.
- Q4.3 Which appendix set is real? Empty stubs P14-18 or filled P19-22, with mismatched titles (P22 "Appendix D: References" vs the stub set's D = dynamic-splitting, E = References)? -> Fix: delete stubs, renumber A-E, References last. If no: judges cannot tell which evidence layer is load-bearing.
- Q4.4 "Measures agreed upfront" defined? (P10 step 02) -> Yes: kWh giveaway delta, RM delta at the fixed price, per-buyer MAPE, per statement. If no: "verify against reality" has no acceptance test, and the no-gain-no-fee is legally uncomputable because "verified extra income" is undefined.

### ROUND 5: STOCHASTIC HONESTY
- Q5.1 Distribution shift? If next year is not like last year (heat waves, EV chargers, new AC), does "same month last year + trend" (P5) survive? -> Yes: show a holdout across a shift year. If no: all percentages are stationary-world numbers.
- Q5.2 Only two-buyer evidence? Backtest covers two-buyer schemes (P19) while the pitch sells schools, petrol stations, hubs joining (P4). -> Yes: extend to N buyers. If no: validated only where allocation is easiest; the growth story invalidates the evidence base as it succeeds.
- Q5.3 Effect size with uncertainty? Median RM saved per scheme with a CI, not just 98% wins (P19)? -> Yes: report RM medians and IQRs. If no: winning often is not winning much; if median gain is small, the 30% fee yields pocket change and the business case follows the evidence down.

**Most dangerous unanswered question (suite):** What is the assumed CREAM energy price, implied 14.2-17.3 sen/kWh by Appendix B (P20), versus 8 sen at P7 and a 9 sen charge at P3, and is its source disclosed, given "the CREAM price is private" (P20)? Every RM impact number (P8, P20) and the entire fee model (P10) multiply this one undisclosed constant; if a judge rejects the price, all financial evidence goes to zero simultaneously.

## Overall most dangerous question

Is monthly re-filing of CREAM buyer shares lawful under GP/ST/No.55/2025, or does each 120-day notice lock a share long enough that WattWise's "evidence-based monthly plan" (P5) is non-compliant as designed? The deck cites the guideline (P22) but never answers this. If the answer is a year-long lock, the core loop is illegal, LEARN cannot feed ALLOCATE, and every downstream number (giveaway cut, RM income, 20% growth, P8) is moot. Runner-up, one subtraction away: the undisclosed CREAM price (P20) that silently prices every RM claim.
