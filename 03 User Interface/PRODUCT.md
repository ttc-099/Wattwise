# PRODUCT.md — WattWise Plan

## What the product is
A software layer that plans the monthly solar allocation for CREAM schemes
(Malaysia's Community Renewable Energy Aggregation Mechanism). It replaces the
fixed annual split guess with evidence-based monthly estimates, allocated 120 days
ahead of each settlement month (CREAM 9.10(e)).

## Who it is for
- Primary operator: the aggregator's energy officer (at SDP, Sime Darby
  Property) who must allocate each month's split for commercial buyers.
- Audience of this build: SDP hackathon judges scoring Problem / Target User /
  Solution / Innovation / How it Works / Impact / Feasibility / Implementation.
- The buyers (LGCs) whose consumption drives every estimate.

## The user's job, in their words
"Tell me what split to file next, four months out, from data I already have,
and show me it beats what we do now."

## How it works (durable product truth)
1. READ — three files: buyers' monthly meter readings, splits already allocated,
   the scheme's solar output. No hardware, no integration.
2. ESTIMATE — each buyer's consumption for the filing month: same month last
   year × (1 + buyer trend). No weather, no calendar features, no ML that
   "learns on its own" — a transparent rule that re-bases from fresh data.
3. ALLOCATE — shares matched to estimates; a slice deliberately held back to
   sell at the NEDA floor rather than risk giving energy away (over-allocating
   costs the contract-price difference; under-allocating costs far less).
4. SETTLE — every filing replayed against actual consumption; the estimate
   re-bases monthly.

## Evidence the product must show (sources of record)
- 590 real buildings' meters (BDG2, Miller et al. 2020; 2016→2017), paired
  into 443 two-buyer schemes: fixed split gives away median 8.66% of
  generation, copy-last-year persistence 5.69%, Plan 3.40%. Plan wins vs
  fixed in 98% of schemes, vs persistence in 87.8%; median income gain vs
  persistence RM2.58–5.28/MWh.
- Elmina scheme settlement (Innovation Park + Lakeside Mall, modelled):
  giveaway 434 → 115 MWh/yr (4.61% → 1.23%), 319 MWh kept ≈ +RM45,209–55,589
  /yr at an assumed 15–30 sen CREAM price; 388 MWh/yr held back for NEDA sale.
- The defensible wedge: a buyer with no history (a new school), where
  persistence is undefined and a forecast is the only option.
- Data files of record: results/plan_real_data.json, results/cream_plan.json,
  results/buyer_mix.json (numbers move when the pipeline reruns; re-read, never
  retype).

## Claim discipline (hard constraints)
- Never claim AI, machine learning, self-learning, or weather/calendar inputs.
- The persistence baseline (same-month-last-year alone, no software) is quoted
  beside every Plan number it is compared against.
- The oracle arm (perfect foresight) is comparison-only, never the headline.
- Modelled and illustrative values are labelled as such on screen; the CREAM
  price is "assumed", homes equivalence "illustrative 5 kWp roofs".
- No "first ever" / "no competitors" claims; the defensible line is "CREAM
  split planning, start to finish, which our research found nowhere else."
- Carbon figures are the scheme's, not WattWise's; keeping energy from being
  given away is income, not carbon.

## Non-goals (explicitly out of scope)
- Township matching, balancing, or real-time monitoring — the EUC's role by
  regulation (CREAM Guideline 10.1).
- Self-consumption rate metrics; nothing instruments them and the committed
  site's is already 100%.

## Voice
Operator-serious and evidence-first. Plain English, short declaratives, no
AI-wordsmithing, no exclamation marks. Numbers carry the argument; labels
carry the honesty.

## Mode
Operate — the visitor completes a task (plan, file, verify). Scanability,
consistency and the real usage scene outrank expression. Brand lives in
precise details.
