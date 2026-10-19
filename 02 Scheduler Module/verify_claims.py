"""Recompute every WattWise Plan headline figure from the committed result files.

No network and no extra data needed. Run:  python verify_claims.py
Exits non-zero if any figure the pitch uses does not reproduce.

CREAM settlement model used by the Plan replay (CREAM Guidelines GP/ST/No.55/2025):
  revenue = delivered_kWh x CREAM_price
          + NEDA_kWh x 0.08            (9.7: Excess Energy sold via NEDA at 8 cent/kWh)
          - 0.09 x (exported - NEDA)   (13.2: CAC charged on exports, excluding NEDA sales)
Energy allocated beyond what a buyer uses is paid nothing (9.9: free energy) but still
carries the CAC. The Plan's gain is revenue(plan) - revenue(fixed split), same year.
The CREAM price is a private bilateral contract (6.16), so it is swept over 15-30 sen.
"""
import json, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, "results")
cream = json.load(open(os.path.join(R, "cream_plan.json")))
real = json.load(open(os.path.join(R, "plan_real_data.json")))
NEDA, CAC = 0.08, 0.09
bad = []


def check(label, got, want, tol=0.6):  # RM tolerance 15: results store MWh to one decimal
    ok = abs(got - want) <= tol
    print(("PASS " if ok else "FAIL ") + label + ": " + str(round(got, 2)) + " vs " + str(want))
    if not ok:
        bad.append(label)


def revenue(x, price):
    kwh = 1000.0
    return (x["delivered_mwh"] * kwh * price + x["neda_mwh"] * kwh * NEDA
            - CAC * kwh * (x["generation_mwh"] - x["neda_mwh"]))


def gain(site, price):
    s = cream[site]["settlement_at_match"]
    return revenue(s["plan"], price) - revenue(s["fixed_annual"], price)


core = cream["township_core"]
park = cream["single_innovation_park"]

# 1. Elmina core: income range at the two ends of the assumed price band (higher gain at the lower price)
lo, hi = core["plan_income_gain_at_match_rm"]
check("Elmina gain at 30 sen (RM)", gain("township_core", 0.30), lo, 15)
check("Elmina gain at 15 sen (RM)", gain("township_core", 0.15), hi, 15)
# 2. Floor case: Innovation Park alone
lo, hi = park["plan_income_gain_at_match_rm"]
check("Innovation Park gain at 30 sen (RM)", gain("single_innovation_park", 0.30), lo, 15)
check("Innovation Park gain at 15 sen (RM)", gain("single_innovation_park", 0.15), hi, 15)
# 3. Kept energy and paid-for share
f, p = core["settlement_at_match"]["fixed_annual"], core["settlement_at_match"]["plan"]
check("Kept from giveaway (MWh)", f["given_away_mwh"] - p["given_away_mwh"], core["kept_from_giveaway_mwh_per_year"], 0.5)
check("Paid-for share, fixed (%)", 100 - f["given_away_pct"], 95.4, 0.05)
check("Paid-for share, plan (%)", 100 - p["given_away_pct"], 98.8, 0.05)
check("Held back via NEDA (MWh)", p["neda_mwh"], 388, 0.5)
kp = park["settlement_at_match"]
check("Innovation Park kept (MWh)", kp["fixed_annual"]["given_away_mwh"] - kp["plan"]["given_away_mwh"], 90, 0.5)
# 4. Effective value of a kept kWh (an output, not an input price)
kept_kwh = core["kept_from_giveaway_mwh_per_year"] * 1000
print("INFO effective sen per kept kWh: %.1f to %.1f"
      % (core["plan_income_gain_at_match_rm"][0] / kept_kwh * 100, core["plan_income_gain_at_match_rm"][1] / kept_kwh * 100))
# 5. 590-building benchmark headline numbers (read from plan_real_data.json)
one, two = real["single_consumer"], real["two_consumer_township"]
check("Buildings in benchmark", one["n"], 590, 0)
check("Two-buyer pairings", two["n"], 443, 0)
check("Two-buyer fixed median (%)", two["given_away_fixed_median_pct"], 8.66, 0.005)
check("Two-buyer plan median (%)", two["given_away_plan_median_pct"], 3.40, 0.005)
check("Two-buyer copy-last-year median (%)", two["given_away_persistence_median_pct"], 5.69, 0.005)
check("Wins vs fixed, two-buyer (%)", two["plan_gives_away_less_share"] * 100, 98.0, 0.05)
check("Wins vs copy-last-year, two-buyer (%)", two["plan_gives_away_less_than_persistence_share"] * 100, 87.8, 0.05)
check("Wins vs copy-last-year, one-buyer (%)", one["plan_gives_away_less_than_persistence_share"] * 100, 91.0, 0.05)
check("Oversize 1.2x plan (%)", two["oversize"]["1.2"]["plan"], 3.66, 0.005)
check("Oversize 1.2x no-worse-than-fixed-at-1x (%)", two["oversize"]["1.2"]["plan_no_worse_than_fixed_at_1x_share"] * 100, 96.6, 0.05)
check("Worst-month error, one-buyer (%)", one["worst_month_forecast_error_median_pct"], 24.3, 0.05)
check("Worst-month error, two-buyer (%)", two["worst_month_forecast_error_median_pct"], 32.1, 0.05)
print("INFO 'typical month 6.6%' is NOT in these files; it is not reproducible from this repository.")
print("\n%d check(s) failed" % len(bad) if bad else "\nAll checks reproduce.")
sys.exit(1 if bad else 0)
