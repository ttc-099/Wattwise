# WattWise: Documentation Log
*A dated record of what changed and why, newest first. The full history is in the git log.*

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
