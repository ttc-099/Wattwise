# builds data/settlement-variants.json: the home chart's year toggle series.
# Imports replay.py and reuses its own maths; nothing here redefines a rule.
# 2017 is the measured replay year (must match plan.json settlement). 2016 is
# ILLUSTRATIVE: BDG2 has no 2015 meters, so the WattWise line for 2016 uses the
# oracle (perfect-foresight) allocation, and the UI labels it as illustrative.
# The retired hot-humid variant works the same way: filter pairs whose site_id
# is in HOT_HUMID_SITES, pick by that group's medians, emit with example_year.
#
# run from 03 User Interface:  python3 scripts/gen_settlement_variants.py

import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
UI = os.path.dirname(HERE)
SCHED = os.path.join(os.path.dirname(UI), "02 Scheduler Module")

spec = importlib.util.spec_from_file_location("replay", os.path.join(SCHED, "replay.py"))
R = importlib.util.module_from_spec(spec)
spec.loader.exec_module(R)

meta, use, pv = R.load_inputs()
good = {b: v for b, v in ((b, R.eligible(v)) for b, v in sorted(use.items())) if v is not None and b in meta}
by_site = {}
for b in sorted(good):
    by_site.setdefault(meta[b]["site_id"], []).append(b)
pairs = [([bs[i], bs[i + 1]], [good[bs[i]], good[bs[i + 1]]])
         for _, bs in sorted(by_site.items()) for i in range(0, len(bs) - 1, 2)]

# same selection rule as replay.py build(): the pair closest to its group's medians
pool = [(ids, R.score(ls, pv)) for ids, ls in pairs]
s = R.summarise([x for _, x in pool])
med_f, med_p = s["given_away_median_pct"]["fixed"], s["given_away_median_pct"]["plan"]
ex_ids = min(pool, key=lambda x: (abs(x[1]["fixed"] - med_f) + abs(x[1]["plan"] - med_p), x[0]))[0]

def gain_rm(used_plan, used_fixed, neda_plan, price):
    # same terms as replay.py revenue(): matched energy, NEDA sale, avoided access charge
    return round((used_plan - used_fixed) * 1000 * price + (R.NEDA_RM_KWH + R.CAC_RM_KWH) * neda_plan * 1000)

def gains_from_rows(rows):
    return {sen: [gain_rm(r["used_plan_mwh"], r["used_fixed_mwh"], r["neda_plan_mwh"], p) for r in rows]
            for sen, p in (("30", 0.30), ("20", 0.20))}

# ---- 2017: the measured replay year, straight from example_year ----
ex = R.example_year([good[b] for b in ex_ids], ex_ids, pv)
mon = ex["monthly"]
g17 = gains_from_rows(mon)
for sen, target in (("30", ex["gain_rm_by_price_sen"]["30"]), ("20", ex["gain_rm_by_price_sen"]["20"])):
    if abs(sum(g17[sen]) - target) > max(30.0, target * 0.002):
        sys.exit("2017 monthly gains do not sum to the yearly figure (%s sen: %d vs %d)" % (sen, sum(g17[sen]), target))

v2017 = {
    "key": "y2017", "label": "2017",
    "basis": "the real two-buyer scheme closest to the 407-scheme medians, scaled to the 1,368-roof Elmina example",
    "buildings": ex_ids,
    "months": [m["month"] for m in mon],
    "fixed": [m["given_away_fixed_mwh"] for m in mon],
    "plan": [m["given_away_plan_mwh"] for m in mon],
    "neda": [m["neda_plan_mwh"] for m in mon],
    "kept_mwh": ex["kept_mwh"],
    "income_gain_rm": [ex["gain_rm_by_price_sen"]["30"], ex["gain_rm_by_price_sen"]["20"]],
    "monthly_gain_rm": g17,
    "illustrative": False, "note": "",
}

# ---- 2016: illustrative. Same buildings, same Elmina scaling; the fixed split
# is real (2016 meters + 2016 PVGIS solar); the WattWise line uses the oracle
# allocation because no 2015 meter history exists to forecast from ----
total = sum(mwh for _, mwh in R.ELMINA_BUYERS) * 1000
k_scale = total / sum(sum(u[:12]) for u in [good[b] for b in ex_ids])
ls = [[v * k_scale for v in good[b]] for b in ex_ids]
kwp = sum(sum(u[:12]) for u in ls) / sum(pv["kwh_per_kwp_long_term"])
lt = pv["kwh_per_kwp_long_term"]
months, fx, pl, nd, rows = [], [], [], [], []
for t in range(0, 12):
    y, m = R.MONTHS[t]
    exp_solar = kwp * lt[m - 1]
    solar = kwp * pv["kwh_per_kwp_by_month"]["%d-%02d" % (y, m)]
    row = {"month": R.MON[t]}
    for pol, arr in (("fixed", fx), ("oracle", pl)):
        sh = R.shares(pol, ls, t, exp_solar, solar)
        used = given = 0.0
        for s_, u in zip(sh, ls):
            a = s_ * solar
            used += min(a, u[t])
            given += max(0.0, a - u[t])
        arr.append(round(given / 1000, 2))
        row["used_fixed_mwh" if pol == "fixed" else "used_plan_mwh"] = round(used / 1000, 2)
    neda = solar * (1 - sum(R.shares("oracle", ls, t, exp_solar, solar)))
    nd.append(round(neda / 1000, 2))
    row["neda_plan_mwh"] = round(neda / 1000, 2)
    rows.append(row)
    months.append(R.MON[t])
g16 = gains_from_rows(rows)

v2016 = {
    "key": "y2016", "label": "2016",
    "basis": "same real scheme, 2016 meters and 2016 solar; illustrative",
    "buildings": ex_ids,
    "months": months, "fixed": fx, "plan": pl, "neda": nd,
    "kept_mwh": round(sum(fx) - sum(pl), 2),
    "income_gain_rm": [sum(g16["30"]), sum(g16["20"])],
    "monthly_gain_rm": g16,
    "illustrative": True,
    "note": "Illustrative year: no meter history exists before 2016, so the WattWise line for 2016 assumes perfect forecasts (the oracle allocation).",
}

out = {"generated_by": "scripts/gen_settlement_variants.py, importing 02 Scheduler Module/replay.py",
       "variants": [v2017, v2016]}

# the first variant must match the settlement block already committed in plan.json
plan = json.load(open(os.path.join(UI, "data", "plan.json"), encoding="utf-8"))
sm = plan["settlement"]
for k in ("fixed", "plan", "neda"):
    if [round(x, 2) for x in v2017[k]] != [round(x, 2) for x in sm[k]]:
        sys.exit("2017 variant %s does not match plan.json settlement" % k)
if v2017["months"] != sm["months"]:
    sys.exit("2017 variant months do not match plan.json settlement")
if abs(v2017["kept_mwh"] - sm["kept_mwh"]) > 0.5:
    sys.exit("2017 variant kept_mwh does not match plan.json settlement")

with open(os.path.join(UI, "data", "settlement-variants.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1)
print("wrote data/settlement-variants.json")
print("2017:", v2017["buildings"], "kept", v2017["kept_mwh"], "MWh, RM", v2017["income_gain_rm"])
print("2016:", v2016["buildings"], "kept", v2016["kept_mwh"], "MWh, RM", v2016["income_gain_rm"], "illustrative")
