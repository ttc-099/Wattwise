# 02 Scheduler Module: WattWise Plan results

This folder holds the committed evidence for the allocation planner. The building-side scheduler (Shift) is not part of WattWise and has been removed.

| File | What it is |
|---|---|
| `results/cream_plan.json` | One modelled year of the Elmina scheme (Innovation Park, plus Lakeside Mall as a modelled second buyer): fixed split vs Plan, month by month |
| `results/plan_real_data.json` | Benchmark of 590 real buildings and 443 two-buyer pairings (Building Data Genome Project 2) |
| `results/buyer_mix.json` | Effect of adding a third buyer to the Elmina scheme (modelled) |
| `verify_claims.py` | Recomputes the headline figures from the files above. Run `python verify_claims.py` |

How each RM figure is derived and what is not reproducible: `../docs/evidence-provenance.md`.
Not in the repository: the script that built `plan_real_data.json`.
