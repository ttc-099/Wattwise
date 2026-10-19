/* WattWise replay, in the browser.
   A line-for-line port of 02 Scheduler Module/replay.py: same inputs, same rules, same rounding,
   so a judge can re-run every number the testing suite quotes without installing anything.
   If the two ever disagree, replay.py is the reference. */
var WWReplay = (function () {
  var MONTHS = [];
  for (var y = 2016; y <= 2017; y++) for (var m = 1; m <= 12; m++) MONTHS.push([y, m]);
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var DEFAULTS = { holdBack: 0.02, trendCap: 0.25, noticeDays: 120, neda: 0.08, cac: 0.09, prices: [0.15, 0.20, 0.25, 0.30],
                   kwpPerRoof: 5.0, oversize: [1.1, 1.2], hotSites: ["Bull"],
                   elmina: [["Elmina Innovation Park", 2626], ["Elmina Lakeside Mall", 6783]] };

  // ---------- Python-compatible rounding and formatting
  function pyRound(x) {                       // round(x): halves go to the even neighbour
    var f = Math.floor(x), d = x - f;
    if (d > 0.5) return f + 1;
    if (d < 0.5) return f;
    return f % 2 === 0 ? f : f + 1;
  }
  // "%.{d}f" % x and round(x, d): Python rounds the exact binary value, halves to even
  function pyFixed(x, d) {
    var neg = x < 0, s = Math.abs(x).toFixed(d + 30), dot = s.indexOf(".");
    var keep = s.slice(0, dot + 1 + d), rest = s.slice(dot + 1 + d);
    var up = rest[0] > "5" || (rest[0] === "5" && (/[1-9]/.test(rest.slice(1)) || (+keep[keep.length - 1] % 2 === 1)));
    var digits = keep.replace(".", ""), n = digits.split("").map(Number);
    if (up) { for (var i = n.length - 1; i >= 0; i--) { if (n[i] < 9) { n[i]++; break; } n[i] = 0; if (i === 0) n.unshift(1); } }
    var str = n.join(""), intLen = str.length - d;
    var out = d ? str.slice(0, intLen) + "." + str.slice(intLen) : str;
    return (neg && /[1-9]/.test(out) ? "-" : "") + out;
  }
  function pyRoundD(x, d) { return Number(pyFixed(x, d)); }
  function sum(xs) { var s = 0; for (var i = 0; i < xs.length; i++) s += xs[i]; return s; }
  function median(xs) {
    var s = xs.slice().sort(function (a, b) { return a - b; }), n = s.length, h = Math.floor(n / 2);
    return n % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
  }
  function p90(xs) { var s = xs.slice().sort(function (a, b) { return a - b; }); return s[pyRound(0.9 * (s.length - 1))]; }
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function comma1(x) { var t = pyFixed(x, 1).split("."); return comma(t[0]) + "." + t[1]; }

  // ---------- inputs
  function parseCsv(text) {
    var lines = text.replace(/\r/g, "").split("\n").filter(function (l) { return l; });
    var head = lines[0].split(",");
    return lines.slice(1).map(function (l) { var p = l.split(","), o = {}; head.forEach(function (h, i) { o[h] = p[i]; }); return o; });
  }
  function load(buildingsCsv, monthlyCsv, pv) {
    var meta = {}, use = {};
    parseCsv(buildingsCsv).forEach(function (r) { meta[r.building_id] = r; });
    parseCsv(monthlyCsv).forEach(function (r) {
      use[r.building_id] = MONTHS.map(function (ym) { var k = ym[0] + "-" + (ym[1] < 10 ? "0" : "") + ym[1]; return r[k] !== "" && r[k] != null ? parseFloat(r[k]) : null; });
    });
    return { meta: meta, use: use, pv: pv };
  }

  function eligible(vals) {
    var i, missing = 0;
    for (i = 12; i < 24; i++) if (vals[i] === null) return null;
    for (i = 0; i < 12; i++) if (vals[i] === null) missing++;
    if (missing > 1) return null;
    var v = vals.slice();
    for (i = 0; i < 12; i++) {
      if (v[i] === null) {
        var nb = [i - 1, i + 1].filter(function (j) { return j >= 0 && j < 24 && v[j] !== null; }).map(function (j) { return v[j]; });
        v[i] = sum(nb) / nb.length;
      }
    }
    var med = median(v);
    if (med <= 0 || Math.min.apply(null, v) < 0.1 * med) return null;
    return v;
  }

  // ---------- the rules
  function lastCompleteMonth(t, P) {
    var y = MONTHS[t][0], m = MONTHS[t][1];
    var release = new Date(Date.UTC(y, m - 1, 1) - P.noticeDays * 86400000);
    var prev = new Date(Date.UTC(release.getUTCFullYear(), release.getUTCMonth(), 1) - 86400000);
    return (prev.getUTCFullYear() - 2016) * 12 + prev.getUTCMonth();
  }
  function estimate(u, t, P) {
    var L = lastCompleteMonth(t, P);
    var w = [L - 2, L - 1, L].filter(function (k) { return k - 12 >= 0; });
    var trend = 0;
    if (w.length === 3) {
      trend = sum(w.map(function (k) { return u[k]; })) / sum(w.map(function (k) { return u[k - 12]; })) - 1;
      trend = Math.max(-P.trendCap, Math.min(P.trendCap, trend));
    }
    return [u[t - 12] * (1 + trend), trend];
  }
  function shares(policy, loads, t, expSolar, actSolar, P) {
    if (policy === "fixed") {
      var last = loads.map(function (u) { return sum(u.slice(0, 12)); }), tot = sum(last);
      return last.map(function (x) { return x / tot; });
    }
    var raw, cap;
    if (policy === "oracle") { raw = loads.map(function (u) { return u[t] / actSolar; }); cap = 1.0; }
    else if (policy === "copy") { raw = loads.map(function (u) { return u[t - 12] / expSolar; }); cap = 1.0; }
    else { raw = loads.map(function (u) { return estimate(u, t, P)[0] / expSolar * (1 - P.holdBack); }); cap = 1 - P.holdBack; }
    var s = sum(raw);
    return s > cap ? raw.map(function (r) { return r * cap / s; }) : raw;
  }
  function replay(loads, kwp, pv, policy, P) {
    var lt = pv.kwh_per_kwp_long_term, months = [];
    for (var t = 12; t < 24; t++) {
      var y = MONTHS[t][0], m = MONTHS[t][1];
      var expSolar = kwp * lt[m - 1];
      var solar = kwp * pv.kwh_per_kwp_by_month[y + "-" + (m < 10 ? "0" : "") + m];
      var sh = shares(policy, loads, t, expSolar, solar, P);
      var used = 0, given = 0;
      for (var i = 0; i < sh.length; i++) {
        var a = sh[i] * solar;
        used += Math.min(a, loads[i][t]);
        given += Math.max(0, a - loads[i][t]);
      }
      months.push({ solar: solar, used: used, given: given, neda: solar * (1 - sum(sh)), shares: sh });
    }
    var tot = {};
    ["solar", "used", "given", "neda"].forEach(function (k) { tot[k] = sum(months.map(function (x) { return x[k]; })); });
    tot.given_pct = tot.given / tot.solar * 100;
    return [months, tot];
  }
  function revenue(tot, price, P) { return tot.used * price + tot.neda * P.neda - P.cac * (tot.solar - tot.neda); }
  function runScheme(loads, pv, ratio, P) {
    var kwp = sum(loads.map(function (u) { return sum(u.slice(0, 12)); })) / sum(pv.kwh_per_kwp_long_term) * ratio;
    var res = {};
    ["fixed", "copy", "plan", "oracle"].forEach(function (p) { res[p] = replay(loads, kwp, pv, p, P); });
    return [kwp, res];
  }

  // ---------- benchmark
  function score(loads, pv, P) {
    var res = runScheme(loads, pv, 1.0, P)[1];
    var f = res.fixed[1], c = res.copy[1], p = res.plan[1], mwh = f.solar / 1000;
    var s = { fixed: f.given_pct, copy: c.given_pct, plan: p.given_pct, gain_fixed: {}, gain_copy: {} };
    P.prices.forEach(function (pr) {
      s.gain_fixed[pr] = (revenue(p, pr, P) - revenue(f, pr, P)) / mwh;
      s.gain_copy[pr] = (revenue(p, pr, P) - revenue(c, pr, P)) / mwh;
    });
    P.oversize.forEach(function (r) {
      var rr = runScheme(loads, pv, r, P)[1];
      s["over_fixed_" + r] = rr.fixed[1].given_pct;
      s["over_plan_" + r] = rr.plan[1].given_pct;
    });
    s.errs = []; s.worst = [];
    loads.forEach(function (u) {
      var e = [];
      for (var t = 12; t < 24; t++) e.push(Math.abs(estimate(u, t, P)[0] - u[t]) / u[t] * 100);
      s.errs = s.errs.concat(e);
      s.worst.push(Math.max.apply(null, e));
    });
    return s;
  }
  function priceKey(pr) { return String(pyRound(pr * 100)); }
  function summarise(scores, P) {
    var n = scores.length;
    var med = function (xs) { return pyRoundD(median(xs), 2); };
    var share = function (xs) { return pyRoundD(xs.filter(Boolean).length / n * 100, 1); };
    var col = function (k) { return scores.map(function (s) { return s[k]; }); };
    var out = {
      n: n,
      given_away_median_pct: { fixed: med(col("fixed")), copy_last_year: med(col("copy")), plan: med(col("plan")) },
      given_away_p90_pct: { fixed: pyRoundD(p90(col("fixed")), 2), copy_last_year: pyRoundD(p90(col("copy")), 2), plan: pyRoundD(p90(col("plan")), 2) },
      kept_median_pct_points: med(scores.map(function (s) { return s.fixed - s.plan; })),
      plan_gives_away_less_than_fixed_pct: share(scores.map(function (s) { return s.plan < s.fixed; })),
      plan_gives_away_less_than_copy_pct: share(scores.map(function (s) { return s.plan < s.copy; })),
      plan_gain_vs_fixed_rm_per_mwh_median: {}, plan_gain_vs_copy_rm_per_mwh_median: {}, plan_earns_more_than_fixed_pct: {}, oversize: {},
      estimate_error_pct: {
        median_month: pyRoundD(median([].concat.apply([], scores.map(function (s) { return s.errs; }))), 1),
        worst_month_median: pyRoundD(median([].concat.apply([], scores.map(function (s) { return s.worst; }))), 1) }
    };
    P.prices.forEach(function (pr) {
      var k = priceKey(pr);
      out.plan_gain_vs_fixed_rm_per_mwh_median[k] = med(scores.map(function (s) { return s.gain_fixed[pr]; }));
      out.plan_gain_vs_copy_rm_per_mwh_median[k] = med(scores.map(function (s) { return s.gain_copy[pr]; }));
      out.plan_earns_more_than_fixed_pct[k] = share(scores.map(function (s) { return s.gain_fixed[pr] > 0; }));
    });
    P.oversize.forEach(function (r) {
      out.oversize[String(r)] = { fixed: med(col("over_fixed_" + r)), plan: med(col("over_plan_" + r)),
        plan_no_worse_than_fixed_at_1x_pct: share(scores.map(function (s) { return s["over_plan_" + r] <= s.fixed; })) };
    });
    return out;
  }

  // ---------- Elmina
  function exampleYear(loads, ids, pv, P) {
    var total = sum(P.elmina.map(function (b) { return b[1]; })) * 1000;
    var k = total / sum(loads.map(function (u) { return sum(u.slice(0, 12)); }));
    var ls = loads.map(function (u) { return u.map(function (v) { return v * k; }); });
    var rs = runScheme(ls, pv, 1.0, P), kwp = rs[0], res = rs[1];
    var f = res.fixed, p = res.plan, c = res.copy, r2 = function (x) { return pyRoundD(x, 2); };
    var monthly = MON.map(function (mo, i) {
      return { month: mo, solar_mwh: r2(f[0][i].solar / 1000), given_away_fixed_mwh: r2(f[0][i].given / 1000), given_away_plan_mwh: r2(p[0][i].given / 1000),
               neda_plan_mwh: r2(p[0][i].neda / 1000), used_fixed_mwh: r2(f[0][i].used / 1000), used_plan_mwh: r2(p[0][i].used / 1000) };
    });
    var tot = function (x) { return { solar: r2(x[1].solar / 1000), used: r2(x[1].used / 1000), given: r2(x[1].given / 1000), neda: r2(x[1].neda / 1000), given_pct: r2(x[1].given_pct) }; };
    var gains = {};
    P.prices.forEach(function (pr) { gains[priceKey(pr)] = pyRound(revenue(p[1], pr, P) - revenue(f[1], pr, P)); });
    return { buildings: ids, scheme_kwp: pyRound(kwp), totals_mwh: { fixed: tot(f), copy_last_year: tot(c), plan: tot(p) },
             kept_mwh: r2((f[1].given - p[1].given) / 1000), gain_rm_by_price_sen: gains, monthly: monthly };
  }
  function elmina(two, one, pv, example, P) {
    var out = {};
    [["core", P.elmina, two], ["innovation_park_alone", P.elmina.slice(0, 1), one]].forEach(function (x) {
      var b = x[2], useMwh = sum(x[1].map(function (q) { return q[1]; }));
      var kwp = useMwh * 1000 / sum(pv.kwh_per_kwp_long_term), g = {};
      Object.keys(b.plan_gain_vs_fixed_rm_per_mwh_median).forEach(function (k) { g[k] = pyRound(b.plan_gain_vs_fixed_rm_per_mwh_median[k] * useMwh); });
      out[x[0]] = { buyers: x[1].map(function (q) { return q[0]; }), assumed_use_mwh: useMwh, scheme_kwp: pyRound(kwp), roofs_illustrative: pyRound(kwp / P.kwpPerRoof),
        given_away_pct: { fixed: b.given_away_median_pct.fixed, plan: b.given_away_median_pct.plan },
        paid_for_pct: { fixed: pyRoundD(100 - b.given_away_median_pct.fixed, 1), plan: pyRoundD(100 - b.given_away_median_pct.plan, 1) },
        kept_mwh: pyRound((b.given_away_median_pct.fixed - b.given_away_median_pct.plan) / 100 * useMwh), gain_rm_by_price_sen: g };
    });
    out.example_year = example;
    return out;
  }

  // ---------- run everything
  function build(inp, opts) {
    var P = {}, k;
    for (k in DEFAULTS) P[k] = DEFAULTS[k];
    for (k in (opts || {})) P[k] = opts[k];
    var meta = inp.meta, pv = inp.pv, good = {};
    Object.keys(inp.use).sort().forEach(function (b) { var v = eligible(inp.use[b]); if (v !== null && meta[b]) good[b] = v; });
    var ids = Object.keys(good).sort(), bySite = {};
    ids.forEach(function (b) { (bySite[meta[b].site_id] = bySite[meta[b].site_id] || []).push(b); });
    var pairs = [];
    Object.keys(bySite).sort().forEach(function (s) { var bs = bySite[s]; for (var i = 0; i + 1 < bs.length; i += 2) pairs.push([bs[i], bs[i + 1]]); });
    var hot = function (pair) { return P.hotSites.indexOf(meta[pair[0]].site_id) >= 0; };
    var sc1 = ids.map(function (b) { return [[b], score([good[b]], pv, P)]; });
    var sc2 = pairs.map(function (pr) { return [pr, score([good[pr[0]], good[pr[1]]], pv, P)]; });
    var two = summarise(sc2.map(function (x) { return x[1]; }), P), one = summarise(sc1.map(function (x) { return x[1]; }), P);
    var mf = two.given_away_median_pct.fixed, mp = two.given_away_median_pct.plan, best = null;
    sc2.forEach(function (x) {
      var d = Math.abs(x[1].fixed - mf) + Math.abs(x[1].plan - mp);
      if (!best || d < best[0] || (d === best[0] && x[0].join("\u0000") < best[1].join("\u0000"))) best = [d, x[0]];
    });
    var example = exampleYear(best[1].map(function (b) { return good[b]; }), best[1], pv, P);
    var benchmark = { buildings: ids.length, sites: Object.keys(bySite).length, one_buyer: one, two_buyer: two,
      hot_humid_one_buyer: summarise(sc1.filter(function (x) { return hot(x[0]); }).map(function (x) { return x[1]; }), P),
      hot_humid_two_buyer: summarise(sc2.filter(function (x) { return hot(x[0]); }).map(function (x) { return x[1]; }), P) };
    var rules = { hold_back: P.holdBack, pvgis_kwh_per_kwp_year: pyRoundD(sum(pv.kwh_per_kwp_long_term), 1) };
    return { rules: rules, benchmark: benchmark, elmina: elmina(two, one, pv, example, P), pairs: pairs, good: good, P: P };
  }

  // the same formatted figures the pages quote (facts() in replay.py)
  function facts(r) {
    var b = r.benchmark, e = r.elmina, ex = e.example_year, core = e.core, park = e.innovation_park_alone;
    var pc = function (x, d) { d = d == null ? 2 : d; return x === 100 ? "100%" : pyFixed(x, d) + "%"; };
    var rm = function (x) { return (x < 0 ? "-RM" : "RM") + comma(Math.abs(pyRound(x / 100) * 100)); };
    var rmx = function (x) { return (x < 0 ? "-RM" : "RM") + pyFixed(Math.abs(x), 2); };
    var f = { n_buildings: comma(b.buildings), n_sites: String(b.sites), hold_back: pc(r.rules.hold_back * 100, 0), pvgis_yield: comma(pyRound(r.rules.pvgis_kwh_per_kwp_year)) };
    [["one", b.one_buyer], ["two", b.two_buyer], ["hot1", b.hot_humid_one_buyer], ["hot2", b.hot_humid_two_buyer]].forEach(function (q) {
      var k = q[0], x = q[1], g = x.given_away_median_pct;
      f[k + "_n"] = comma(x.n); f[k + "_fixed"] = pc(g.fixed); f[k + "_copy"] = pc(g.copy_last_year); f[k + "_plan"] = pc(g.plan);
      f[k + "_fixed_p90"] = pc(x.given_away_p90_pct.fixed); f[k + "_plan_p90"] = pc(x.given_away_p90_pct.plan);
      f[k + "_less_fixed"] = pc(x.plan_gives_away_less_than_fixed_pct, 1); f[k + "_less_copy"] = pc(x.plan_gives_away_less_than_copy_pct, 1);
      f[k + "_earns_15"] = pc(x.plan_earns_more_than_fixed_pct["15"], 1); f[k + "_earns_30"] = pc(x.plan_earns_more_than_fixed_pct["30"], 1);
      f[k + "_gain_15"] = rmx(x.plan_gain_vs_fixed_rm_per_mwh_median["15"]); f[k + "_gain_30"] = rmx(x.plan_gain_vs_fixed_rm_per_mwh_median["30"]);
      f[k + "_gcopy_15"] = rmx(x.plan_gain_vs_copy_rm_per_mwh_median["15"]); f[k + "_gcopy_30"] = rmx(x.plan_gain_vs_copy_rm_per_mwh_median["30"]);
      f[k + "_err_med"] = pc(x.estimate_error_pct.median_month, 1); f[k + "_err_worst"] = pc(x.estimate_error_pct.worst_month_median, 1);
      r.P.oversize.forEach(function (ratio) {
        var o = x.oversize[String(ratio)], t = String(ratio).replace(".", "");
        f[k + "_o" + t + "_fixed"] = pc(o.fixed); f[k + "_o" + t + "_plan"] = pc(o.plan); f[k + "_o" + t + "_nw"] = pc(o.plan_no_worse_than_fixed_at_1x_pct, 1);
      });
    });
    [["el", core], ["ip", park]].forEach(function (q) {
      var k = q[0], s = q[1], g = s.gain_rm_by_price_sen;
      f[k + "_mwh"] = comma(s.assumed_use_mwh); f[k + "_kwp"] = comma(s.scheme_kwp); f[k + "_roofs"] = comma(s.roofs_illustrative);
      f[k + "_kept"] = comma(s.kept_mwh); f[k + "_paid_fixed"] = pc(s.paid_for_pct.fixed, 1); f[k + "_paid_plan"] = pc(s.paid_for_pct.plan, 1);
      ["15", "20", "25", "30"].forEach(function (p) { f[k + "_gain_" + p] = rm(g[p]); });
      f[k + "_roof_15"] = "RM" + pyRound(g["15"] / s.roofs_illustrative); f[k + "_roof_30"] = "RM" + pyRound(g["30"] / s.roofs_illustrative);
    });
    var t = ex.totals_mwh;
    f.ex_buildings = ex.buildings.join(" and "); f.ex_kwp = comma(ex.scheme_kwp); f.ex_solar = comma1(t.fixed.solar);
    f.ex_fixed = comma1(t.fixed.given); f.ex_copy = comma1(t.copy_last_year.given); f.ex_plan = comma1(t.plan.given);
    f.ex_fixed_pct = pc(t.fixed.given_pct); f.ex_copy_pct = pc(t.copy_last_year.given_pct); f.ex_plan_pct = pc(t.plan.given_pct);
    f.ex_kept = comma1(ex.kept_mwh); f.ex_neda = comma1(t.plan.neda); f.ex_used_fixed = comma1(t.fixed.used); f.ex_used_plan = comma1(t.plan.used);
    f.ex_cut = pyRound((1 - t.plan.given / t.fixed.given) * 100) + "%";
    f.ex_gain_15 = rm(ex.gain_rm_by_price_sen["15"]); f.ex_gain_30 = rm(ex.gain_rm_by_price_sen["30"]);
    return f;
  }

  return { load: load, build: build, facts: facts, exampleYear: exampleYear, fmt: pyFixed, DEFAULTS: DEFAULTS, MON: MON };
})();
if (typeof module !== "undefined") module.exports = WWReplay;
