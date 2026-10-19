"""Build the committed inputs for replay.py from public sources.

Judges do not need to run this: its outputs are committed in ./data. Run it to
check that those files really come from the public sources.

    python build_inputs.py [--cache DIR]

Downloads (about 175 MB, cached in DIR, default ./.cache):
  1. Building Data Genome Project 2 (Miller et al., 2020, CC-BY 4.0), hourly
     electricity meters for 1,578 buildings, 2016-2017, and building metadata.
     https://github.com/buds-lab/building-data-genome-project-2
  2. PVGIS 5.2 (European Commission JRC), rooftop PV yield at the City of Elmina
     (3.185 N, 101.51 E): 1 kWp, 15 degree roof facing south, building-mounted,
     14% system loss. Long-term monthly averages and the hourly 2015-2017 series.
     https://re.jrc.ec.europa.eu/pvg_tools/en/

Writes:
  data/bdg2_monthly_kwh.csv   one row per building, 24 monthly kWh (blank = not enough readings)
  data/bdg2_buildings.csv     building_id, site_id, primary use, timezone
  data/pvgis_elmina.json      kWh per kWp: long-term average per month, and each month of 2015-2017
"""
import argparse, csv, json, os, sys, urllib.request, hashlib
from calendar import monthrange

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
BDG2 = "https://media.githubusercontent.com/media/buds-lab/building-data-genome-project-2/master/data/"
FILES = {
    "electricity_cleaned.csv": (BDG2 + "meters/cleaned/electricity_cleaned.csv",
                                "b6ffc9b4dfcefe5c753594730a08ae822b0d50fec6815abb8f185591e6c630a3"),
    "metadata.csv": (BDG2 + "metadata/metadata.csv",
                     "992d0b29f24f96ad4332bc4dbb534b7bdd7dd2689aad093f94e93068ecddca02"),
}
PV_QUERY = "lat=3.185&lon=101.51&peakpower=1&loss=14&angle=15&aspect=0&mountingplace=building&outputformat=json"
PV_CALC = "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?" + PV_QUERY
PV_SERIES = "https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?" + PV_QUERY + "&pvcalculation=1&startyear=2015&endyear=2017"
MONTHS = [(y, m) for y in (2016, 2017) for m in range(1, 13)]
MIN_COVERAGE = 0.9   # a month needs readings for at least 90% of its hours


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch(url, dest):
    if not os.path.exists(dest):
        print("downloading", url)
        urllib.request.urlretrieve(url, dest)
    return dest


def monthly_bdg2(cache):
    path = os.path.join(cache, "electricity_cleaned.csv")
    with open(path, newline="") as f:
        rd = csv.reader(f)
        head = next(rd)
        ids = head[1:]
        n = len(ids)
        sums = {ym: [0.0] * n for ym in MONTHS}
        cnts = {ym: [0] * n for ym in MONTHS}
        for row in rd:
            ym = (int(row[0][:4]), int(row[0][5:7]))
            s, c = sums[ym], cnts[ym]
            for i, v in enumerate(row[1:]):
                if v != "":
                    s[i] += float(v)
                    c[i] += 1
    out = []
    for i, b in enumerate(ids):
        vals = []
        for (y, m) in MONTHS:
            hours = monthrange(y, m)[1] * 24
            c = cnts[(y, m)][i]
            vals.append(round(sums[(y, m)][i] / c * hours, 1) if c >= MIN_COVERAGE * hours else "")
        out.append([b] + vals)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=os.path.join(HERE, ".cache"))
    a = ap.parse_args()
    os.makedirs(a.cache, exist_ok=True)
    os.makedirs(DATA, exist_ok=True)
    for name, (url, digest) in FILES.items():
        p = fetch(url, os.path.join(a.cache, name))
        if sha256(p) != digest:
            sys.exit(name + ": checksum does not match the published file")

    rows = monthly_bdg2(a.cache)
    with open(os.path.join(DATA, "bdg2_monthly_kwh.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["building_id"] + ["%d-%02d" % ym for ym in MONTHS])
        w.writerows(rows)
    with open(os.path.join(a.cache, "metadata.csv"), newline="") as f, \
         open(os.path.join(DATA, "bdg2_buildings.csv"), "w", newline="") as g:
        w = csv.writer(g)
        w.writerow(["building_id", "site_id", "primaryspaceusage", "timezone"])
        for r in csv.DictReader(f):
            w.writerow([r["building_id"], r["site_id"], r["primaryspaceusage"], r["timezone"]])

    calc = json.load(open(fetch(PV_CALC, os.path.join(a.cache, "pvgis_calc.json"))))
    series = json.load(open(fetch(PV_SERIES, os.path.join(a.cache, "pvgis_series_2015_2017.json"))))
    by_month = {}
    for r in series["outputs"]["hourly"]:
        k = r["time"][:4] + "-" + r["time"][4:6]
        by_month[k] = by_month.get(k, 0.0) + r["P"] / 1000.0
    pv = {
        "source": "PVGIS 5.2, European Commission Joint Research Centre",
        "query": PV_QUERY,
        "radiation_db": calc["inputs"]["meteo_data"]["radiation_db"],
        "kwh_per_kwp_long_term": [m["E_m"] for m in calc["outputs"]["monthly"]["fixed"]],
        "kwh_per_kwp_by_month": {k: round(v, 2) for k, v in sorted(by_month.items())},
    }
    json.dump(pv, open(os.path.join(DATA, "pvgis_elmina.json"), "w"), indent=1)
    ok = sum(1 for r in rows if all(v != "" for v in r[1:]))
    print("buildings:", len(rows), "with all 24 months:", ok)


if __name__ == "__main__":
    main()
