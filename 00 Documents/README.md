# WattWise: solar splits that fit

WattWise is software that tells Sime Darby Property (SDP) how to share its residents' rooftop solar between the buildings that buy it, four months ahead. It is Team Promax's entry to the Sime Darby Hackathon 2026, "Township of Tomorrow".

The pitch deck is in this folder: [WattWise Pitch Deck.pdf](WattWise%20Pitch%20Deck.pdf).

## The problem

Under Malaysia's Community Renewable Energy Aggregation Mechanism (CREAM), the aggregator (SDP at Elmina) pools solar from home roofs and supplies nearby buyers. Three rules in the Energy Commission's Guidelines (GP/ST/No.55/2025) make fixed splits costly:

- **120 days' notice.** Each buyer's percentage share must be filed in writing 120 days before it takes effect, and only changes on the 1st of a month (clause 9.10(e)). The share is set before the real demand is known.
- **Over-allocation is lost.** Solar sent to a buyer beyond what it uses is "free energy" to the grid and earns nothing (9.9), while the 9 sen/kWh community access charge still applies to it (13.2).
- **Held-back solar can be sold.** Solar the aggregator keeps back can be sold through NEDA at 8 sen/kWh, with no access charge (9.7, 13.2). The Commission can change that rate.

Replayed on real meter readings, a fixed split gives away a median 8.66% of the year's solar across 443 two-buyer schemes, and 10.05% in Malaysia-like climates.

## What WattWise does

1. **Read** each buyer's monthly meter history.
2. **Estimate** each buyer's use for a month that has not happened yet: the same month last year, adjusted by the latest trend. The estimator only sees data that existed before the release date.
3. **Allocate** each buyer a share of scheme solar proportional to its estimate, and hold a small slice back to sell through NEDA.
4. **File.** Each month is stamped with its notice date, 120 days before it starts. WattWise suggests, the scheme admin approves, SDP files. The tool never sends anything on its own.
5. **Settle.** Once TNB bills the month on real meters, compare what was allocated with what was used.

## Results

All figures are in `02 Scheduler Module/results` and can be recomputed with `python "02 Scheduler Module/verify_claims.py"`. How each was derived, and what cannot be reproduced yet, is in [docs/evidence-provenance.md](../docs/evidence-provenance.md).

| Result | Figure | Basis |
|---|---|---|
| Median solar given away, 443 two-buyer schemes | fixed 8.66%, copy-last-year 5.69%, WattWise 3.40% | 590 real buildings (Building Data Genome Project 2), measured |
| Malaysia-like climates (55 schemes) | fixed 10.05%, WattWise 4.19% | Florida and Texas sites, measured |
| Beats a fixed split | 98.0% of schemes | measured |
| Beats copy-last-year | 87.8% (two-buyer) to 91.0% (one-buyer) | measured |
| Scheme built 1.2x larger | WattWise gives away 3.66%, below a fixed split's 8.66% today | measured |
| Elmina, one modelled year | 319 MWh kept from being given away; paid-for share 95.4% to 98.8% | modelled, with a second buyer |
| Extra scheme income, Elmina | RM45,200 to RM55,600 a year | modelled, at an assumed 15 to 30 sen/kWh CREAM price (the real price is private) |
| Floor case: Innovation Park alone | 90 MWh, RM12,800 to RM15,600 a year | modelled |

Not measured at Elmina: the benchmark uses public data from other countries, because no Malaysian building meter data is public. Lakeside Mall as a second buyer is a modelling assumption.

## The prototype (operator app)

`03 User Interface/admin.html` is the app the scheme admin would use. It is a static page; open it from a local web server (`START-DASHBOARD.bat`, or `python -m http.server` in `03 User Interface`). Only the buyers' meter-readings CSV is read today.

| | |
|---|---|
| ![Home](screenshots/prototype-1-home.png) **Home.** What the admin has to do next, and the notice deadline. | ![Allocations](screenshots/prototype-2-allocations.png) **Allocations.** Each month on a five-step line, with its 120-day notice deadline. |
| ![Engine](screenshots/prototype-3-estimation-engine.png) **Engine.** Same month last year times trend, per buyer, with the hold-back. | ![Notice preview](screenshots/prototype-4-notice-preview.png) **Notice preview.** The email and PDF each buyer would receive, shown before anything is sent. |
| ![Settlements](screenshots/prototype-5-settlements.png) **Settlements.** A month allocated against what was used. | ![Homes map](screenshots/prototype-6-homes-map.png) **Homes.** CREAM homes on the neighbourhood plan; click one to see its modelled solar. |

## The testing suite (for judges)

`03 User Interface/tests.html` explains how the estimate works and tests each claim in the deck, one appendix per claim, with the raw numbers and the code behind them.

| | |
|---|---|
| ![Home](screenshots/testing-1-home.png) **Start here.** The headline result and the four appendices. | ![How the estimate works](screenshots/testing-2-how-the-estimate-works.png) **How the estimate works.** A live worked example: estimate, share, hold-back, settle. |
| ![Appendix B](screenshots/testing-3-appendix-b-money.png) **Appendix B.** The money, step by step, at the assumed price band. | |

Appendix A tests fixed vs WattWise over a modelled year, B the income, C whether a scheme can be built 20% larger, and D dynamic splitting against fixed and copy-last-year across the 590 buildings.

## Repository layout

- `00 Documents/`: this README, the pitch deck, screenshots, and the documentation log
- `01 Prediction Module/`, `04 Physical Kit/`: earlier building-side experiments, not part of WattWise
- `02 Scheduler Module/results/`: the committed evidence (`cream_plan.json`, `plan_real_data.json`, `buyer_mix.json`) and `verify_claims.py` one level up
- `03 User Interface/`: `admin.html` (prototype), `tests.html` (testing suite), `PRODUCT.md` and `DESIGN.md`
- `docs/`: `evidence-provenance.md`, the red-team report and the action plan

## Status and limits

A working prototype and tests on real past data. It has not been trialled at Elmina, and SDP has not approved a pilot. The proposed pilot is a no-cost, three-month shadow run: SDP shares three files, WattWise suggests splits, SDP still files. The script that built the 590-building benchmark is not in the repository yet.

## References

Energy Commission (2025) *Guidelines for Community Renewable Energy Aggregation Mechanism (CREAM)*, GP/ST/No.55/2025. Miller, C. et al. (2020) 'The Building Data Genome Project 2', *Scientific Data*, 7, 368. Skrine (2025) *Energy Commission issues guidelines for Malaysia's CREAM*. The full list is on the last slide of the deck.
