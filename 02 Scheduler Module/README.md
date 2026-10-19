# 02 Scheduler Module: the WattWise replay

One script produces every number in the deck, the operator app and the testing suite.

```
python replay.py           # rebuild results/ and 03 User Interface/data/plan.json + plan.js
python replay.py --check   # confirm the committed results match a fresh run
```

Standard Python, no packages, about a second. The rules (notice, estimate, allocate, settle) are written at the top of `replay.py`.

| File | What it is |
|---|---|
| `replay.py` | The replay: real meters, real rooftop solar, CREAM's 120-day notice and settlement rules |
| `build_inputs.py` | Rebuilds `data/` from the public sources (BDG2 meters, PVGIS solar); not needed to re-run the replay |
| `data/` | The committed inputs: monthly electricity of 1,578 real buildings, their sites, and rooftop solar at Elmina |
| `results/replay.json` | Everything the replay measured: benchmark, Elmina figures, the example year |
| `results/elmina_example_year.csv` | The month-by-month example shown in Appendix A |

How each figure is derived, and what it rests on: [docs/evidence-provenance.md](../docs/evidence-provenance.md).
