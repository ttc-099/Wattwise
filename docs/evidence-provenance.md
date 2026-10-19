# Evidence provenance: where each WattWise number comes from

Every number in the pitch deck, the operator app and the testing suite comes from one script:

```
cd "02 Scheduler Module"
python replay.py           # rebuilds results/ and 03 User Interface/data/plan.json + plan.js
python replay.py --check   # confirms the committed results match a fresh run
```

Standard Python, no packages, about a second. The rules are written at the top of `replay.py`.

## Inputs (committed in `02 Scheduler Module/data`)

| File | What it is | Source |
|---|---|---|
| `bdg2_monthly_kwh.csv` | Monthly electricity of 1,578 real buildings, 2016-2017 | Building Data Genome Project 2 (Miller et al., 2020, CC-BY 4.0), hourly meters summed by month; a month counts if at least 90% of its hours have readings |
| `bdg2_buildings.csv` | Site and primary use of each building | BDG2 metadata |
| `pvgis_elmina.json` | Rooftop solar per kWp at the City of Elmina: long-term monthly average and each month of 2015-2017 | PVGIS 5.2 (European Commission JRC), PVGIS-ERA5, 3.185 N 101.51 E, 15 degree roof facing south, building-mounted, 14% loss |

`python build_inputs.py` downloads the public files (about 175 MB, checksums pinned) and rebuilds these three files.

## Settled against the CREAM Guidelines (GP/ST/No.55/2025)

| Rule used in the replay | Guideline | Result |
|---|---|---|
| Held-back energy sold via NEDA at 8 sen/kWh | 9.7: "8 cent/kWh or any other rate as may be determined by the Commission" | Confirmed. The rate can change, so every RM figure is modelled. |
| No access charge (CAC) on NEDA sales | 9.7 "CAC does not apply to LEGA"; 13.2 the charge excludes energy sold via NEDA | Confirmed. |
| Energy allocated beyond a buyer's use earns nothing | 9.9: "free energy to the Distribution System" | Confirmed. The 9 sen CAC still applies to it (13.2). |
| 120-day notice, effective on the 1st of a month | 9.10(e) | Confirmed. |
| CREAM price is private | 6.16: bilateral contract between buyer and aggregator | Confirmed. Money is shown at 15, 20, 25 and 30 sen/kWh. |

8 sen against 9 sen is not a conflict: they apply to different energy. Given-away energy pays 9 sen and earns nothing; NEDA energy earns 8 sen and pays no charge. So an over-allocated kWh costs about 17 sen, and an under-allocated one costs the CREAM price minus 17 sen.
Caveat: the Guidelines define "Excess Energy" as export above a buyer's maximum demand after it withdraws from the programme. Selling deliberately held-back energy through NEDA rests on 9.7 as the team reads it; confirm with the Energy Commission before relying on it in a filing.

## How the main figures are built

- **Benchmark.** Buildings with all of 2017 and at most one missing 2016 month (filled from its neighbours), and no month under 10% of the building's median: 821 buildings at 11 sites. Each is a one-buyer scheme; buildings at the same site are paired in id order into 407 two-buyer schemes. Each scheme gets rooftop solar sized so expected yearly solar equals its 2016 use, and 2017 is replayed month by month under a fixed split, copy-last-year and WattWise.
- **Hot-humid.** The Texas site (Bull) is the only humid subtropical site with complete data; earlier drafts' Florida sites (Panther, Gator) have whole months missing in 2016.
- **Elmina.** No Elmina meter data is public. Elmina figures are the benchmark medians applied to the assumed scheme size (Innovation Park 2,626 MWh + Lakeside Mall 6,783 MWh a year). The month-by-month example in Appendix A is the real two-buyer scheme closest to the median result, scaled to that size.
- **Money.** revenue = used kWh x price + NEDA kWh x 0.08 - 0.09 x (solar - NEDA kWh), computed for WattWise and for a fixed split over the same year; the difference is the extra income.

## What changed from earlier drafts

The earlier figures (590 buildings, 443 pairs, 8.66% to 3.40%, RM45,200-55,600, a 6.6% typical error) came from scripts that are not in the repository, and the Elmina year used loads from the removed building simulator. They could not be re-run, so they were replaced by this replay. Two results moved materially: the extra income is smaller at high CREAM prices, and above about 20 sen copying last year earns slightly more than WattWise (the hold-back sells at 8 sen some energy a buyer would have used). Both are stated on the pages.
