# Evidence provenance: where each WattWise number comes from

Checked 19 October 2026 against the CREAM Guidelines (GP/ST/No.55/2025, st.gov.my) and the committed result files.
Reproduce the checkable figures with `python "02 Scheduler Module/verify_claims.py"` (no network).

## Settled against the guideline text

| Claim | Guideline | Result |
|---|---|---|
| Held-back energy is sold via NEDA at 8 sen/kWh | 9.7: "8 cent/kWh or any other rate as may be determined by the Commission" | Confirmed. The rate can change, so every RM figure is modelled. |
| The 9 sen access charge (CAC) does not apply to NEDA sales | 9.7 "CAC does not apply to LEGA"; 13.2 the charge excludes energy sold via NEDA | Confirmed. |
| Energy allocated beyond a buyer's use is given away unpaid | 9.9: imbalance energy "will not be compensated through NEDA ... free energy" | Confirmed. The CAC still applies to it (13.2 counts all other exported energy). |
| 120-day notice | 9.10(e): allocation changes in writing 120 days before; effective only on the 1st of a month | Confirmed. |
| CREAM energy price is private | 6.16: buyer pays the aggregator under a bilateral contract | Confirmed. No public price, so 15-30 sen is an assumption. |

**8 sen against 9 sen is not a conflict.** They apply to different energy. Energy given away pays the 9 sen and earns nothing (9.9, 13.2). Energy held back and sold via NEDA earns 8 sen and pays no CAC (9.7, 13.2). That is why a wrongly allocated kWh costs 17 sen (8 forgone + 9 charge) against NEDA.
Definition caveat: the Guidelines define "Excess Energy" (clause 2) as export above a buyer's maximum monthly demand due to withdrawal from the programme. Using the same route for deliberately held-back energy rests on 9.7 as the team reads it; confirm with the Energy Commission before relying on it in a filing.

## How RM45,200-55,600 a year is derived

Replay of one year of the modelled Elmina scheme (Innovation Park plus Lakeside Mall), same solar, two policies. Annual revenue per policy:

`revenue = delivered_kWh x CREAM_price + NEDA_kWh x 0.08 - 0.09 x (exported_kWh - NEDA_kWh)`

| | Delivered MWh | Given away MWh | NEDA MWh |
|---|---|---|---|
| Fixed yearly split | 8,975.0 | 434.2 | 0 |
| WattWise Plan | 8,905.8 | 115.3 | 388.0 |

Gain = revenue(Plan) - revenue(fixed). It is a function of the assumed CREAM price: RM55,580 at 15 sen, 52,120 at 20, 48,660 at 25, 45,200 at 30. The gain is larger at a low CREAM price because the held-back energy sells at 8 sen instead of being given away. The range in the deck is therefore the price band 30 to 15 sen. "14.2 to 17.4 sen per kept kWh" is only the result divided by the 319 MWh kept, not an input. The same formula gives the floor case (Innovation Park alone): RM12,788 at 30 sen and RM15,608 at 15 sen, on 90 MWh kept.
It depends on a second buyer (Lakeside Mall) that is modelled, not announced.

## Not reproducible from this repository

- **The script that built the 590-building benchmark** (`plan_real_data.json`). Only its output is committed. The headline figures are read back and checked by `verify_claims.py`, but not recomputed from the Building Data Genome Project 2 meters. The `run_all.py` and `real_data_validation.json` named in earlier pitch drafts are not in the repository.
- **"Typical month estimate error 6.6%".** It appears in an earlier pitch draft as the median error of a forecaster on 26 real hot-humid buildings (`real_data_validation.json`, not committed). It is not a measurement of the "same month last year plus trend" estimator, so it has been removed from both HTML pages. The worst-month errors (24.3% one-buyer, 32.1% two-buyer) are committed and kept.
