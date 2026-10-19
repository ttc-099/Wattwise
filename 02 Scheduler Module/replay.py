"""WattWise Plan: the replay behind every number on the pitch deck, the operator app and the testing suite.

    python replay.py            rebuild results/, 03 User Interface/data/plan.json + plan.js and the numbers in the pages
    python replay.py --check    rebuild in memory and confirm the committed files match

Standard library only, runs in about a second. Inputs are committed in ./data
(build_inputs.py shows where they come from and can rebuild them):
  data/bdg2_monthly_kwh.csv  real monthly electricity use, 2016-2017 (Building Data Genome Project 2)
  data/bdg2_buildings.csv    site and primary use of each building
  data/pvgis_elmina.json     rooftop solar yield at the City of Elmina (PVGIS 5.2)

THE RULES (one place, used for every result)

Notice. The share for a month is filed 120 days before the month starts (CREAM 9.10(e)).
  The estimate may only use months that were complete before that release date.

Estimate. Same month last year x (1 + trend). Trend = use in the latest 3 complete months
  / use in the same 3 months a year earlier - 1, limited to +/-25%. If those year-earlier
  months are not in the data, trend = 0.

Policies, for each month of 2017:
  fixed      today's practice: one split for the whole year, from each buyer's share of last
             year's use, and all solar allocated
  copy       each buyer gets same month last year / expected solar (no trend, no hold-back)
  plan       WattWise: each buyer gets estimate / expected solar, minus a 2% hold-back; if the
             estimates add up to more than the expected solar, shares are scaled down to 98%
  oracle     knows the actual use (a ceiling, never a claim)
  Expected solar = scheme kWp x PVGIS long-term average for that month.

Settlement (CREAM Guidelines GP/ST/No.55/2025). Actual solar = scheme kWp x PVGIS for that month of 2017.
  allocated to a buyer = share x actual solar
  used: min(allocated, the buyer's use)            -> paid at the CREAM price
  given away: allocated - used, if positive        -> paid nothing (9.9), access charge still due
  not allocated (held back)                        -> sold via NEDA at 8 sen/kWh, no access charge (9.7, 13.2)
  revenue = used x price + NEDA x 0.08 - 0.09 x (solar - NEDA)
  The CREAM price is private (6.16), so money is shown at 15, 20, 25 and 30 sen/kWh.

Scheme size. Built so expected yearly solar equals the buyers' use last year (2016) x size ratio.

Elmina. No Elmina meter data is public. The Elmina figures are the benchmark medians applied to
  the scheme size assumed in the pitch (Innovation Park 2,626 MWh and Lakeside Mall 6,783 MWh a
  year; the Mall as a buyer is an assumption). The month-by-month example is the real two-buyer
  scheme closest to the median result, scaled to that size.
"""
import argparse, csv, json, os, re, statistics, sys
from datetime import date, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
RESULTS = os.path.join(HERE, "results")
UI_PLAN = os.path.join(HERE, "..", "03 User Interface", "data", "plan.json")

HOLD_BACK = 0.02
TREND_CAP = 0.25
NOTICE_DAYS = 120
NEDA_RM_KWH = 0.08
CAC_RM_KWH = 0.09
PRICES = [0.15, 0.20, 0.25, 0.30]
KWP_PER_ROOF = 5.0
OVERSIZE = [1.1, 1.2]
HOT_HUMID_SITES = ["Bull"]          # Texas: the only humid subtropical site with complete 2016-2017 data
ELMINA_BUYERS = [("Elmina Innovation Park", 2626), ("Elmina Lakeside Mall", 6783)]   # assumed MWh a year
MONTHS = [(y, m) for y in (2016, 2017) for m in range(1, 13)]
MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


# ---------------------------------------------------------------- inputs
def load_inputs():
    meta = {r["building_id"]: r for r in csv.DictReader(open(os.path.join(DATA, "bdg2_buildings.csv"), newline=""))}
    use = {}
    for r in csv.DictReader(open(os.path.join(DATA, "bdg2_monthly_kwh.csv"), newline="")):
        use[r["building_id"]] = [float(r["%d-%02d" % ym]) if r["%d-%02d" % ym] != "" else None for ym in MONTHS]
    pv = json.load(open(os.path.join(DATA, "pvgis_elmina.json")))
    return meta, use, pv


def eligible(vals):
    """2017 complete; at most one missing month in 2016 (filled from its neighbours); no dead months."""
    if any(v is None for v in vals[12:]) or sum(v is None for v in vals[:12]) > 1:
        return None
    v = list(vals)
    for i in range(12):
        if v[i] is None:
            nb = [v[j] for j in (i - 1, i + 1) if 0 <= j < 24 and v[j] is not None]
            v[i] = sum(nb) / len(nb)
    med = statistics.median(v)
    if med <= 0 or min(v) < 0.1 * med:
        return None
    return v


# ---------------------------------------------------------------- the rules
def last_complete_month(t):
    """Index of the last month complete before the release date of target month index t."""
    y, m = MONTHS[t]
    release = date(y, m, 1) - timedelta(days=NOTICE_DAYS)
    prev = date(release.year, release.month, 1) - timedelta(days=1)
    return (prev.year - 2016) * 12 + prev.month - 1


def estimate(u, t):
    L = last_complete_month(t)
    window = [k for k in (L - 2, L - 1, L) if k - 12 >= 0]
    trend = 0.0
    if len(window) == 3:
        trend = sum(u[k] for k in window) / sum(u[k - 12] for k in window) - 1
        trend = max(-TREND_CAP, min(TREND_CAP, trend))
    return u[t - 12] * (1 + trend), trend


def shares(policy, loads, t, exp_solar, act_solar):
    if policy == "fixed":
        last = [sum(u[:12]) for u in loads]
        return [x / sum(last) for x in last]
    if policy == "oracle":
        raw = [u[t] / act_solar for u in loads]
        cap = 1.0
    elif policy == "copy":
        raw = [u[t - 12] / exp_solar for u in loads]
        cap = 1.0
    else:  # plan
        raw = [estimate(u, t)[0] / exp_solar * (1 - HOLD_BACK) for u in loads]
        cap = 1 - HOLD_BACK
    s = sum(raw)
    return [r * cap / s for r in raw] if s > cap else raw


def replay(loads, kwp, pv, policy):
    lt = pv["kwh_per_kwp_long_term"]
    months = []
    for t in range(12, 24):
        y, m = MONTHS[t]
        exp_solar = kwp * lt[m - 1]
        solar = kwp * pv["kwh_per_kwp_by_month"]["%d-%02d" % (y, m)]
        sh = shares(policy, loads, t, exp_solar, solar)
        used = given = 0.0
        for s, u in zip(sh, loads):
            a = s * solar
            used += min(a, u[t])
            given += max(0.0, a - u[t])
        months.append({"solar": solar, "used": used, "given": given, "neda": solar * (1 - sum(sh)), "shares": sh})
    tot = {k: sum(x[k] for x in months) for k in ("solar", "used", "given", "neda")}
    tot["given_pct"] = tot["given"] / tot["solar"] * 100
    return months, tot


def revenue(tot, price):
    return tot["used"] * price + tot["neda"] * NEDA_RM_KWH - CAC_RM_KWH * (tot["solar"] - tot["neda"])


def run_scheme(loads, pv, ratio=1.0):
    kwp = sum(sum(u[:12]) for u in loads) / sum(pv["kwh_per_kwp_long_term"]) * ratio
    return kwp, {p: replay(loads, kwp, pv, p) for p in ("fixed", "copy", "plan", "oracle")}


# ---------------------------------------------------------------- benchmark
def r2(x):
    return round(x, 2)


def p90(xs):
    xs = sorted(xs)
    return xs[int(round(0.9 * (len(xs) - 1)))]


def score(loads, pv):
    """Everything measured for one scheme."""
    kwp, res = run_scheme(loads, pv)
    f, c, p = res["fixed"][1], res["copy"][1], res["plan"][1]
    mwh = f["solar"] / 1000
    s = {"fixed": f["given_pct"], "copy": c["given_pct"], "plan": p["given_pct"],
         "gain_fixed": {pr: (revenue(p, pr) - revenue(f, pr)) / mwh for pr in PRICES},
         "gain_copy": {pr: (revenue(p, pr) - revenue(c, pr)) / mwh for pr in PRICES}}
    for r in OVERSIZE:
        _, rr = run_scheme(loads, pv, r)
        s["over_fixed_%s" % r] = rr["fixed"][1]["given_pct"]
        s["over_plan_%s" % r] = rr["plan"][1]["given_pct"]
    errs = [abs(estimate(u, t)[0] - u[t]) / u[t] * 100 for u in loads for t in range(12, 24)]
    s["errs"] = errs
    s["worst"] = [max(abs(estimate(u, t)[0] - u[t]) / u[t] * 100 for t in range(12, 24)) for u in loads]
    return s


def summarise(scores):
    n = len(scores)
    med = lambda xs: r2(statistics.median(xs))
    share = lambda xs: round(sum(xs) / n * 100, 1)
    col = lambda k: [s[k] for s in scores]
    out = {
        "n": n,
        "given_away_median_pct": {"fixed": med(col("fixed")), "copy_last_year": med(col("copy")), "plan": med(col("plan"))},
        "given_away_p90_pct": {"fixed": r2(p90(col("fixed"))), "copy_last_year": r2(p90(col("copy"))), "plan": r2(p90(col("plan")))},
        "kept_median_pct_points": med([s["fixed"] - s["plan"] for s in scores]),
        "plan_gives_away_less_than_fixed_pct": share([s["plan"] < s["fixed"] for s in scores]),
        "plan_gives_away_less_than_copy_pct": share([s["plan"] < s["copy"] for s in scores]),
        "plan_gain_vs_fixed_rm_per_mwh_median": {"%d" % round(pr * 100): med([s["gain_fixed"][pr] for s in scores]) for pr in PRICES},
        "plan_gain_vs_copy_rm_per_mwh_median": {"%d" % round(pr * 100): med([s["gain_copy"][pr] for s in scores]) for pr in PRICES},
        "plan_earns_more_than_fixed_pct": {"%d" % round(pr * 100): share([s["gain_fixed"][pr] > 0 for s in scores]) for pr in PRICES},
        "oversize": {str(r): {"fixed": med(col("over_fixed_%s" % r)), "plan": med(col("over_plan_%s" % r)),
                              "plan_no_worse_than_fixed_at_1x_pct": share([s["over_plan_%s" % r] <= s["fixed"] for s in scores])}
                     for r in OVERSIZE},
        "estimate_error_pct": {"median_month": round(statistics.median([e for s in scores for e in s["errs"]]), 1),
                               "worst_month_median": round(statistics.median([w for s in scores for w in s["worst"]]), 1)},
    }
    return out


# ---------------------------------------------------------------- Elmina
def example_year(loads, label_ids, pv):
    """One real scheme, scaled to the Elmina size, month by month."""
    total = sum(mwh for _, mwh in ELMINA_BUYERS) * 1000
    k = total / sum(sum(u[:12]) for u in loads)
    ls = [[v * k for v in u] for u in loads]
    kwp, res = run_scheme(ls, pv)
    f, p, c = res["fixed"], res["plan"], res["copy"]
    monthly = [{"month": MON[i], "solar_mwh": r2(f[0][i]["solar"] / 1000),
                "given_away_fixed_mwh": r2(f[0][i]["given"] / 1000), "given_away_plan_mwh": r2(p[0][i]["given"] / 1000),
                "neda_plan_mwh": r2(p[0][i]["neda"] / 1000),
                "used_fixed_mwh": r2(f[0][i]["used"] / 1000), "used_plan_mwh": r2(p[0][i]["used"] / 1000)} for i in range(12)]
    tot = lambda x: {"solar": r2(x[1]["solar"] / 1000), "used": r2(x[1]["used"] / 1000), "given": r2(x[1]["given"] / 1000),
                     "neda": r2(x[1]["neda"] / 1000), "given_pct": r2(x[1]["given_pct"])}
    return {"buildings": label_ids, "scaled_to_mwh_2016": total / 1000, "scheme_kwp": round(kwp),
            "totals_mwh": {"fixed": tot(f), "copy_last_year": tot(c), "plan": tot(p)},
            "kept_mwh": r2((f[1]["given"] - p[1]["given"]) / 1000),
            "gain_rm_by_price_sen": {"%d" % round(pr * 100): round(revenue(p[1], pr) - revenue(f[1], pr)) for pr in PRICES},
            "monthly": monthly}


def elmina(two, one, pv, example):
    out = {}
    for key, buyers, b in (("core", ELMINA_BUYERS, two), ("innovation_park_alone", ELMINA_BUYERS[:1], one)):
        use_mwh = sum(m for _, m in buyers)
        kwp = use_mwh * 1000 / sum(pv["kwh_per_kwp_long_term"])
        out[key] = {
            "buyers": [n for n, _ in buyers], "assumed_use_mwh": use_mwh,
            "scheme_kwp": round(kwp), "roofs_illustrative": round(kwp / KWP_PER_ROOF),
            "expected_solar_mwh": use_mwh,
            "given_away_pct": {"fixed": b["given_away_median_pct"]["fixed"], "plan": b["given_away_median_pct"]["plan"]},
            "paid_for_pct": {"fixed": round(100 - b["given_away_median_pct"]["fixed"], 1), "plan": round(100 - b["given_away_median_pct"]["plan"], 1)},
            "kept_mwh": round((b["given_away_median_pct"]["fixed"] - b["given_away_median_pct"]["plan"]) / 100 * use_mwh),
            "gain_rm_by_price_sen": {k: round(v * use_mwh) for k, v in b["plan_gain_vs_fixed_rm_per_mwh_median"].items()},
            "basis": "median of the %d real %s schemes, applied to %d MWh a year" % (b["n"], "two-buyer" if len(buyers) == 2 else "one-buyer", use_mwh),
        }
    out["example_year"] = example
    return out


# ---------------------------------------------------------------- run
def build():
    meta, use, pv = load_inputs()
    good = {b: v for b, v in ((b, eligible(v)) for b, v in sorted(use.items())) if v is not None and b in meta}
    by_site = {}
    for b in sorted(good):
        by_site.setdefault(meta[b]["site_id"], []).append(b)
    singles = [([b], [good[b]]) for b in sorted(good)]
    pairs = [([bs[i], bs[i + 1]], [good[bs[i]], good[bs[i + 1]]]) for _, bs in sorted(by_site.items()) for i in range(0, len(bs) - 1, 2)]
    hot = lambda ids: meta[ids[0]]["site_id"] in HOT_HUMID_SITES
    sc1 = [(ids, score(ls, pv)) for ids, ls in singles]
    sc2 = [(ids, score(ls, pv)) for ids, ls in pairs]
    two = summarise([s for _, s in sc2])
    one = summarise([s for _, s in sc1])
    med_f, med_p = two["given_away_median_pct"]["fixed"], two["given_away_median_pct"]["plan"]
    # the example: the real two-buyer scheme whose fixed and WattWise results are closest to the medians
    ex_ids = min(sc2, key=lambda x: (abs(x[1]["fixed"] - med_f) + abs(x[1]["plan"] - med_p), x[0]))[0]
    example = example_year([good[b] for b in ex_ids], ex_ids, pv)
    benchmark = {
        "source": "Building Data Genome Project 2 (Miller et al., 2020), real monthly electricity 2016-2017; solar: PVGIS 5.2 at the City of Elmina",
        "buildings": len(good), "sites": len(by_site),
        "eligibility": "2017 complete; at most one missing 2016 month, filled from its neighbours; no month under 10% of the building's median",
        "pairing": "two-buyer schemes pair buildings of the same site in building-id order",
        "hot_humid_sites": HOT_HUMID_SITES,
        "one_buyer": one, "two_buyer": two,
        "hot_humid_one_buyer": summarise([s for ids, s in sc1 if hot(ids)]),
        "hot_humid_two_buyer": summarise([s for ids, s in sc2 if hot(ids)]),
    }
    rules = {"hold_back": HOLD_BACK, "trend_cap": TREND_CAP, "notice_days": NOTICE_DAYS, "neda_rm_kwh": NEDA_RM_KWH,
             "access_charge_rm_kwh": CAC_RM_KWH, "prices_rm_kwh": PRICES, "kwp_per_roof": KWP_PER_ROOF,
             "pvgis_kwh_per_kwp_year": round(sum(pv["kwh_per_kwp_long_term"]), 1),
             "pvgis_kwh_per_kwp_long_term": pv["kwh_per_kwp_long_term"]}
    return {"rules": rules, "benchmark": benchmark, "elmina": elmina(two, one, pv, example)}


def facts(r):
    """Every number the web pages quote, already formatted. The pages fill [data-v] elements from these."""
    b, e = r["benchmark"], r["elmina"]
    ex, core, park = e["example_year"], e["core"], e["innovation_park_alone"]
    pc = lambda x, d=2: "100%" if x == 100 else ("%." + str(d) + "f%%") % x
    rm = lambda x: ("-RM%s" if x < 0 else "RM%s") % format(abs(int(round(x / 100.0) * 100)), ",")
    rmx = lambda x: ("-RM%.2f" if x < 0 else "RM%.2f") % abs(x)
    f = {"n_buildings": "{:,}".format(b["buildings"]), "n_sites": str(b["sites"]), "hold_back": pc(r["rules"]["hold_back"] * 100, 0),
         "pvgis_yield": "{:,}".format(round(r["rules"]["pvgis_kwh_per_kwp_year"]))}
    for k, x in (("one", b["one_buyer"]), ("two", b["two_buyer"]), ("hot1", b["hot_humid_one_buyer"]), ("hot2", b["hot_humid_two_buyer"])):
        g = x["given_away_median_pct"]
        f.update({k + "_n": "{:,}".format(x["n"]), k + "_fixed": pc(g["fixed"]), k + "_copy": pc(g["copy_last_year"]), k + "_plan": pc(g["plan"]),
                  k + "_fixed_p90": pc(x["given_away_p90_pct"]["fixed"]), k + "_plan_p90": pc(x["given_away_p90_pct"]["plan"]),
                  k + "_less_fixed": pc(x["plan_gives_away_less_than_fixed_pct"], 1), k + "_less_copy": pc(x["plan_gives_away_less_than_copy_pct"], 1),
                  k + "_earns_15": pc(x["plan_earns_more_than_fixed_pct"]["15"], 1), k + "_earns_30": pc(x["plan_earns_more_than_fixed_pct"]["30"], 1),
                  k + "_gain_15": rmx(x["plan_gain_vs_fixed_rm_per_mwh_median"]["15"]), k + "_gain_30": rmx(x["plan_gain_vs_fixed_rm_per_mwh_median"]["30"]),
                  k + "_gcopy_15": rmx(x["plan_gain_vs_copy_rm_per_mwh_median"]["15"]), k + "_gcopy_30": rmx(x["plan_gain_vs_copy_rm_per_mwh_median"]["30"]),
                  k + "_err_med": pc(x["estimate_error_pct"]["median_month"], 1), k + "_err_worst": pc(x["estimate_error_pct"]["worst_month_median"], 1)})
        for ratio in OVERSIZE:
            o = x["oversize"][str(ratio)]
            t = str(ratio).replace(".", "")
            f.update({k + "_o%s_fixed" % t: pc(o["fixed"]), k + "_o%s_plan" % t: pc(o["plan"]), k + "_o%s_nw" % t: pc(o["plan_no_worse_than_fixed_at_1x_pct"], 1)})
    for k, s in (("el", core), ("ip", park)):
        g = s["gain_rm_by_price_sen"]
        f.update({k + "_mwh": "{:,}".format(s["assumed_use_mwh"]), k + "_kwp": "{:,}".format(s["scheme_kwp"]), k + "_roofs": "{:,}".format(s["roofs_illustrative"]),
                  k + "_kept": "{:,}".format(s["kept_mwh"]), k + "_paid_fixed": pc(s["paid_for_pct"]["fixed"], 1), k + "_paid_plan": pc(s["paid_for_pct"]["plan"], 1),
                  k + "_gain_15": rm(g["15"]), k + "_gain_20": rm(g["20"]), k + "_gain_25": rm(g["25"]), k + "_gain_30": rm(g["30"]),
                  k + "_roof_15": "RM%d" % round(g["15"] / s["roofs_illustrative"]), k + "_roof_30": "RM%d" % round(g["30"] / s["roofs_illustrative"])})
    t = ex["totals_mwh"]
    f.update({"ex_buildings": " and ".join(ex["buildings"]), "ex_kwp": "{:,}".format(ex["scheme_kwp"]),
              "ex_solar": "{:,.1f}".format(t["fixed"]["solar"]),
              "ex_fixed": "{:,.1f}".format(t["fixed"]["given"]), "ex_copy": "{:,.1f}".format(t["copy_last_year"]["given"]), "ex_plan": "{:,.1f}".format(t["plan"]["given"]),
              "ex_fixed_pct": pc(t["fixed"]["given_pct"]), "ex_copy_pct": pc(t["copy_last_year"]["given_pct"]), "ex_plan_pct": pc(t["plan"]["given_pct"]),
              "ex_kept": "{:,.1f}".format(ex["kept_mwh"]), "ex_neda": "{:,.1f}".format(t["plan"]["neda"]),
              "ex_used_fixed": "{:,.1f}".format(t["fixed"]["used"]), "ex_used_plan": "{:,.1f}".format(t["plan"]["used"]),
              "ex_cut": "%d%%" % round((1 - t["plan"]["given"] / t["fixed"]["given"]) * 100),
              "ex_gain_15": rm(ex["gain_rm_by_price_sen"]["15"]), "ex_gain_30": rm(ex["gain_rm_by_price_sen"]["30"])})
    return f


def ui_plan(r):
    """The file the operator app and the testing suite read."""
    b, e = r["benchmark"], r["elmina"]
    ex = e["example_year"]

    def benchrow(label, x):
        g = x["plan_gain_vs_copy_rm_per_mwh_median"]
        return {"label": label, "n": x["n"], "fixed": x["given_away_median_pct"]["fixed"],
                "persistence": x["given_away_median_pct"]["copy_last_year"], "plan": x["given_away_median_pct"]["plan"],
                "win_vs_fixed_pct": x["plan_gives_away_less_than_fixed_pct"], "win_vs_persistence_pct": x["plan_gives_away_less_than_copy_pct"],
                "gain_vs_persistence_rm_mwh": [g["30"], g["15"]]}

    def mix(s, key):
        g = s["gain_rm_by_price_sen"]
        return {"key": key, "buyers": s["buyers"], "scheme_kwp": s["scheme_kwp"], "homes_illustrative": s["roofs_illustrative"],
                "given_away_pct_fixed": s["given_away_pct"]["fixed"], "given_away_pct_plan": s["given_away_pct"]["plan"],
                "kept_for_residents_mwh": s["kept_mwh"], "plan_income_gain_rm": [min(g.values()), max(g.values())]}

    core = e["core"]
    return {
        "basis": core["buyers"],
        "headline": {"scheme_solar_mwh": core["expected_solar_mwh"], "kwp_match": core["scheme_kwp"],
                     "homes_illustrative": core["roofs_illustrative"], "lead_months": 4, "hold_back_pct": HOLD_BACK * 100,
                     "expected_solar_mwh_by_month": [r2(core["scheme_kwp"] * k / 1000) for k in r["rules"]["pvgis_kwh_per_kwp_long_term"]],
                     "trend_cap_pct": TREND_CAP * 100},
        "settlement": {
            "example_buildings": ex["buildings"],
            "months": MON,
            "generation": [m["solar_mwh"] for m in ex["monthly"]],
            "fixed": [m["given_away_fixed_mwh"] for m in ex["monthly"]],
            "plan": [m["given_away_plan_mwh"] for m in ex["monthly"]],
            "neda": [m["neda_plan_mwh"] for m in ex["monthly"]],
            "totals": {"fixed": {"given_away_mwh": ex["totals_mwh"]["fixed"]["given"], "pct": ex["totals_mwh"]["fixed"]["given_pct"],
                                 "delivered": ex["totals_mwh"]["fixed"]["used"], "neda": ex["totals_mwh"]["fixed"]["neda"]},
                       "plan": {"given_away_mwh": ex["totals_mwh"]["plan"]["given"], "pct": ex["totals_mwh"]["plan"]["given_pct"],
                                "delivered": ex["totals_mwh"]["plan"]["used"], "neda": ex["totals_mwh"]["plan"]["neda"]}},
            "kept_mwh": ex["kept_mwh"],
            "income_gain_rm": [min(ex["gain_rm_by_price_sen"].values()), max(ex["gain_rm_by_price_sen"].values())],
        },
        "elmina": {k: core[k] for k in ("kept_mwh", "gain_rm_by_price_sen", "paid_for_pct", "given_away_pct", "basis")},
        "facts": facts(r),
        "buyer_mix": [mix(core, "core"), mix(e["innovation_park_alone"], "innovation_park_alone")],
        "bench": [benchrow("Single-buyer schemes", b["one_buyer"]), benchrow("Two-buyer schemes", b["two_buyer"]),
                  benchrow("Hot-humid two-buyer", b["hot_humid_two_buyer"])],
        "sources": {
            "settlement": "02 Scheduler Module/replay.py: the real two-buyer scheme closest to the median result (%s), scaled to the Elmina size, PVGIS rooftop solar at Elmina, each month filed 120 days ahead (CREAM 9.10(e)), against a fixed annual split." % " + ".join(ex["buildings"]),
            "bench": "Building Data Genome Project 2 (Miller et al., 2020), real monthly electricity 2016-2017; PVGIS 5.2 rooftop solar at Elmina",
            "prices": "CREAM price assumed at 15-30 sen/kWh; not public (CREAM 6.16)",
            "neda": "held-back energy sold via NEDA at 8 sen/kWh, no access charge (CREAM 9.7, 13.2); its green attributes go to the Single Buyer (12.3)",
            "homes": "illustrative 5 kWp per roof",
        },
    }


def monthly_csv(ex):
    rows = ["month,solar_mwh,given_away_fixed_mwh,given_away_plan_mwh,neda_plan_mwh,used_fixed_mwh,used_plan_mwh"]
    for m in ex["monthly"]:
        rows.append(",".join(str(m[k]) for k in ("month", "solar_mwh", "given_away_fixed_mwh", "given_away_plan_mwh", "neda_plan_mwh", "used_fixed_mwh", "used_plan_mwh")))
    return "\n".join(rows) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    r = build()
    dump = lambda o: json.dumps(o, indent=1) + "\n"
    files = {os.path.join(RESULTS, "replay.json"): dump(r), os.path.normpath(UI_PLAN): dump(ui_plan(r)),
             os.path.join(RESULTS, "elmina_example_year.csv"): monthly_csv(r["elmina"]["example_year"]),
             os.path.normpath(UI_PLAN[:-2]): "// written by 02 Scheduler Module/replay.py, do not edit\nwindow.PLAN_DATA = " + dump(ui_plan(r)).rstrip() + ";\n"}
    # the web pages quote numbers in <span data-v="key">value</span>; keep the written values current too
    facts_now = facts(r)
    for page in ("tests.html", "index.html"):
        p = os.path.normpath(os.path.join(os.path.dirname(UI_PLAN), "..", page))
        html = open(p, encoding="utf-8").read()
        files[p] = re.sub(r'(<span data-v="(\w+)">)[^<]*(</span>)', lambda m: m.group(1) + facts_now[m.group(2)] + m.group(3), html)
    if a.check:
        bad = [p for p, txt in files.items() if not os.path.exists(p) or open(p, encoding="utf-8").read() != txt]
        for p in bad:
            print("DIFFERS:", p)
        print("All committed results match a fresh replay." if not bad else "Committed results do not match a fresh replay.")
        sys.exit(1 if bad else 0)
    os.makedirs(RESULTS, exist_ok=True)
    for p, txt in files.items():
        with open(p, "w", encoding="utf-8", newline="\n") as f:
            f.write(txt)
    b, c = r["benchmark"], r["elmina"]["core"]
    print("buildings %d, one-buyer %d, two-buyer %d" % (b["buildings"], b["one_buyer"]["n"], b["two_buyer"]["n"]))
    print("two-buyer median given away: fixed %(fixed)s%%, copy last year %(copy_last_year)s%%, WattWise %(plan)s%%" % b["two_buyer"]["given_away_median_pct"])
    print("Elmina size: kept %s MWh a year, extra income RM%s (30 sen) to RM%s (15 sen)" % (c["kept_mwh"], c["gain_rm_by_price_sen"]["30"], c["gain_rm_by_price_sen"]["15"]))


if __name__ == "__main__":
    main()
