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
   year × (1 + trend), trend = latest 3 complete months vs the same months a
   year earlier, within ±25%. No weather, no calendar features, no ML.
3. ALLOCATE — share = estimate ÷ the larger of expected scheme solar and the
   sum of estimates, × (1 − 2% hold-back). What is not allocated is sold via
   NEDA (8 sen/kWh, no access charge). Over-allocating a kWh costs ~17 sen;
   under-allocating costs (CREAM price − 17 sen).
4. SETTLE — every filing replayed against actual consumption; the estimate
   re-bases monthly.

## Evidence the product must show (sources of record)
- One command rebuilds every number: `python "02 Scheduler Module/replay.py"`
  (`--check` confirms the committed results match). Inputs: BDG2 monthly
  electricity (Miller et al. 2020) and PVGIS rooftop solar at Elmina, both
  committed in `02 Scheduler Module/data`.
- Results of record: `02 Scheduler Module/results/replay.json`; the web pages
  read `data/plan.json` / `data/plan.js`, which replay.py writes. Numbers move
  when the replay changes: re-read, never retype.
- Elmina figures are benchmark medians applied to the assumed scheme size
  (Innovation Park 2,626 + Lakeside Mall 6,783 MWh a year); no Elmina meter
  data is public. The Mall as a buyer is an assumption.
- Money depends on the private CREAM price: quote it at 15–30 sen, and say
  that copy-last-year earns slightly more than WattWise above ~20 sen.
- The defensible wedge: a buyer with no history (a new school), where
  persistence is undefined and a forecast is the only option.

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
