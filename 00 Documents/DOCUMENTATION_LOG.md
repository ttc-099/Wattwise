# WattWise: Documentation Log
*A dated record of what changed and why, newest first. The full history is in the git log.*

### 2026-10-19: Re-runnable evidence and live demo
- Added `02 Scheduler Module/replay.py`: one command rebuilds every number in the deck, the operator app and the testing suite, from public data committed in `02 Scheduler Module/data` (BDG2 meters of 1,578 buildings, PVGIS rooftop solar at Elmina). `build_inputs.py` rebuilds that data from the sources; `replay.py --check` confirms the committed results.
- Replaced the earlier figures, whose scripts were never in the repository: 821 buildings and 407 two-buyer schemes; median give-away fixed 6.05%, copy-last-year 1.95%, WattWise 1.34%; Elmina-size extra income RM24,600 to RM76,000 a year at 30 to 15 sen.
- Hold-back default set to 2% (was 5%); the trend is now read from the meter file by the same rule as the replay.
- The testing suite reads its numbers from `data/plan.js`; Appendix A shows a real scheme month by month, with NEDA sales and a CSV download.
- Netlify config and a landing page for the live demo; the deck links to it.

### 2026-10-19: Evidence and cleanup
- Fact-checked the deck and both HTML pages against the CREAM Guidelines and the committed results. NEDA at 8 sen with no access charge (9.7, 13.2) and the RM45,200 to 55,600 revenue formula are written up in `docs/evidence-provenance.md`.
- Added `02 Scheduler Module/verify_claims.py`, which recomputes every headline figure from the committed results.
- Removed the building-side scheduler and the dashboard that depended on it. WattWise is the allocation planner only.
- Removed the unsourced "6.6% typical month error" claim. The script behind the 590-building benchmark is still not in the repository.
- Added the corrected pitch deck and a product README with screenshots to this folder.

### 2026-10-18: Testing suite
- `tests.html` for judges: how the estimate works, four appendices (A to D), the engine code, and references.
- Operator app: allocation lifecycle with 120-day notice deadlines, estimation engine with hold-back, notice preview, settlements, and site maps with meter history.

### 2026-10-17: Operator app and design pass
- Homeowners, buyers and energy allocations; dashboard restyles; detector findings brought to zero.

### 2026-10-12 to 2026-10-14: First builds
- First dashboard, charts and data model for the township demo.
