/* "Watch the replay run": steps one month of one real scheme through the replay, showing the rules
   (the real lines of replay.py), the numbers going into each line, and a graph of what they mean. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var fmt = WWReplay.fmt;
  var C = { fixed: "#B7AA9C", plan: "#F7931E", a: "#EA6B3D", b: "#8A3A12", neda: "#F9B915", ink: "#15120F", muted: "#5E5048", line: "#ECE2D6", given: "#5E5048" };
  var MON = WWReplay.MON;
  var STEPS = [
    { k: "read", name: "Read", code: ["def last_complete_month", "return (prev.year"] },
    { k: "trend", name: "Trend", code: ["L = last_complete_month(t)", "trend = max("] },
    { k: "est", name: "Estimate", code: ["return u[t - 12] * (1 + trend)", "return u[t - 12] * (1 + trend)"] },
    { k: "share", name: "Share", code: ["else:  # plan", "return [r * cap"] },
    { k: "solar", name: "Solar", code: ["exp_solar = kwp * lt[m - 1]", "solar = kwp * pv["] },
    { k: "settle", name: "Settle", code: ["used = given = 0.0", "months.append("] },
    { k: "money", name: "Money", code: ["def revenue", "return tot[\"used\"]"] },
    { k: "year", name: "Year", code: ["tot = {k: sum(", "tot[\"given_pct\"]"] },
    { k: "bench", name: "All schemes", code: ["\"given_away_median_pct\"", "\"given_away_median_pct\""] }
  ];
  var S = { ready: false, pair: null, mi: 0, step: 0, price: 30, timer: null };
  var INP = null, R = null;

  // ---------- data
  function load() {
    if (R) return Promise.resolve(R);
    return Promise.all([fetch("data/replay/bdg2_buildings.csv").then(function (r) { return r.text(); }),
                        fetch("data/replay/bdg2_monthly_kwh.csv").then(function (r) { return r.text(); }),
                        fetch("data/replay/pvgis_elmina.json").then(function (r) { return r.json(); })])
      .then(function (x) { INP = WWReplay.load(x[0], x[1], x[2]); R = WWReplay.build(INP); return R; });
  }
  function trace() {
    var loads = WWReplay.scaleLoads(S.pair.map(function (b) { return R.good[b]; }), R.P);
    return WWReplay.trace(loads, INP.pv, R.P, 12 + S.mi, S.price / 100);
  }
  function allMonths() {
    var loads = WWReplay.scaleLoads(S.pair.map(function (b) { return R.good[b]; }), R.P), out = [];
    for (var t = 12; t < 24; t++) out.push(WWReplay.trace(loads, INP.pv, R.P, t, S.price / 100));
    return out;
  }
  var short = function (b) { return b.replace(/^[A-Za-z]+_/, "").replace(/_/g, " "); };
  var mwh = function (x, d) { return fmt(x / 1000, d == null ? 1 : d); };

  // ---------- tiny SVG helpers
  function svg(w, h, inner) { return '<svg class="wk-svg" viewBox="0 0 ' + w + " " + h + '" role="img" aria-hidden="true">' + inner + "</svg>"; }
  function rect(x, y, w, h, fill, extra) { return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(w, 0).toFixed(1) + '" height="' + Math.max(h, 0).toFixed(1) + '" rx="3" fill="' + fill + '" ' + (extra || "") + "/>"; }
  function text(x, y, t, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 11) + '" fill="' + (o.fill || C.muted) + '" text-anchor="' + (o.anchor || "middle") + '" font-weight="' + (o.weight || 500) + '">' + t + "</text>"; }
  // grouped columns over a list of labelled groups; series = [{vals, color}]
  function columns(groups, series, o) {
    o = o || {};
    var W = o.w || 640, H = o.h || 190, pl = 6, pb = 24, pt = 18, gw = (W - pl) / groups.length, bw = Math.min(26, (gw - 6) / series.length);
    var max = o.max || Math.max.apply(null, [].concat.apply([], series.map(function (s) { return s.vals; }))) || 1, out = "";
    groups.forEach(function (g, i) {
      var x0 = pl + i * gw + (gw - bw * series.length) / 2;
      if (o.hi === i) out += rect(pl + i * gw + 1, pt - 8, gw - 2, H - pt - pb + 12, "#FFF4E2", 'stroke="#15120F" stroke-width="2" stroke-dasharray="4 3"');
      series.forEach(function (s, k) {
        var h = (H - pt - pb) * (s.vals[i] / max);
        out += rect(x0 + k * bw, H - pb - h, bw - 2, h, s.color, o.dim && o.dim(i) ? 'opacity=".28"' : "");
        if (o.vals && (o.hi === i || o.all)) out += text(x0 + k * bw + (bw - 2) / 2, H - pb - h - 4, o.vals(s.vals[i]), { size: 10.5, fill: C.ink, weight: 700 });
      });
      out += text(pl + i * gw + gw / 2, H - 7, g, { size: 11, fill: o.hi === i ? C.ink : C.muted, weight: o.hi === i ? 800 : 500 });
    });
    return svg(W, H, out);
  }
  function legend(items) { return '<div class="wk-lg">' + items.map(function (i) { return '<span><i style="background:' + i[1] + '"></i>' + i[0] + "</span>"; }).join("") + "</div>"; }
  var HATCH = '<defs><pattern id="wk-h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#F7931E"/><rect width="4" height="8" fill="#FBC27E"/></pattern></defs>';
  // one horizontal bar split into labelled parts (widths in the same unit)
  function stack(parts, total, o) {
    o = o || {}; var W = 640, H = o.h || 46, x = 0, out = HATCH;
    parts.forEach(function (p) {
      var w = W * p.v / total;
      if (w <= 0.2) return;
      out += rect(x, 4, w, H - 8, p.fill, 'stroke="#fff" stroke-width="2"');
      if (w > (p.minW || 110)) out += text(x + w / 2, H / 2 + 4, p.label, { size: 11.5, fill: p.dark ? "#fff" : C.ink, weight: 700 });
      x += w;
    });
    return svg(W, H, out);
  }

  // ---------- the step panels
  function pRead(x) {
    var rel = x.release.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    var vals = function (b) { return b.series; };
    return { plain: "The share for <b>" + x.month + " 2017</b> is filed on <b>" + rel + "</b>, 120 days before the month starts. On that day only months already finished can be read, so the newest reading is <b>" +
        MON[x.windowMonths[2][1] - 1] + " " + x.windowMonths[2][0] + "</b>. The starting point for each buyer is the same month a year earlier.",
      viz: legend([[short(S.pair[0]), C.a], [short(S.pair[1]), C.b]]) + '<p class="wk-cap">Monthly use in 2016 (MWh). The highlighted month is where the estimate starts.</p>' +
        columns(MON.map(function (m) { return m.charAt(0); }), x.buyers.map(function (b, i) { return { vals: b.series.map(function (v) { return v / 1000; }), color: i ? C.b : C.a }; }), { hi: x.t - 12, vals: function (v) { return fmt(v, 0); } }),
      calc: x.buyers.map(function (b, i) { return short(S.pair[i]) + ": " + x.month + " 2016 = <b>" + mwh(b.lastYear) + " MWh</b>"; }).join("<br>") };
  }
  function pTrend(x) {
    var wm = x.windowMonths, lab = wm.map(function (ym) { return MON[ym[1] - 1]; });
    if (!x.hasTrend) {
      return { plain: "The trend needs the same three months a year earlier. For " + x.month + " 2017 the latest finished months are " + lab.join(", ") + " 2016, and the data has nothing before 2016, so the rule falls back to <b>trend = 0</b> and the estimate is simply last year's figure. (From about April onwards the trend can be measured.)",
        viz: '<div class="wk-facts"><div><b>0%</b><span>trend, no earlier year to compare with</span></div></div>', calc: "no year-earlier months on file, so trend = 0 (the rule in <span class=\"mono\">estimate()</span>)" };
    }
    var cells = x.buyers.map(function (b, i) {
      return '<div class="wk-mini"><b>' + short(S.pair[i]) + "</b>" +
        columns(lab, [{ vals: b.prev.map(function (v) { return v / 1000; }), color: "#DCCFBF" }, { vals: b.now.map(function (v) { return v / 1000; }), color: i ? C.b : C.a }], { w: 300, h: 150, all: true, vals: function (v) { return fmt(v, 0); } }) +
        '<p class="wk-eq">' + mwh(b.now.reduce(function (a, c) { return a + c; }, 0), 0) + " &divide; " + mwh(b.prev.reduce(function (a, c) { return a + c; }, 0), 0) + " &minus; 1 = <b>" + fmt(b.rawTrend * 100, 1) + "%</b>" +
        (Math.abs(b.rawTrend) > R.P.trendCap ? " &rarr; capped at <b>" + fmt(b.trend * 100, 1) + "%</b>" : "") + "</p></div>";
    }).join("");
    return { plain: "Buyers grow or shrink, so the estimate is nudged by a <b>trend</b>: the last three finished months (" + lab.join(", ") + ") against the same three months a year earlier. It is kept within &plusmn;" + (R.P.trendCap * 100) + "%.",
      viz: legend([["a year earlier", "#DCCFBF"], ["this year", C.a]]) + '<div class="wk-two">' + cells + "</div>",
      calc: "trend = (sum of the latest 3 months) &divide; (the same 3 months a year earlier) &minus; 1" };
  }
  function pEst(x) {
    var cells = x.buyers.map(function (b, i) {
      var err = (b.estimate - b.actual) / b.actual * 100;
      return '<div class="wk-mini"><b>' + short(S.pair[i]) + "</b>" +
        columns(["last year", "estimate", "what happened"], [{ vals: [b.lastYear / 1000, b.estimate / 1000, b.actual / 1000], color: i ? C.b : C.a }], { w: 300, h: 160, all: true, vals: function (v) { return fmt(v, 0); }, hi: 1 }) +
        '<p class="wk-eq">' + mwh(b.lastYear, 0) + " &times; (1 " + (b.trend < 0 ? "&minus; " : "+ ") + fmt(Math.abs(b.trend) * 100, 1) + "%) = <b>" + mwh(b.estimate, 0) + " MWh</b><br>off by " + fmt(Math.abs(err), 1) + "% once the month is known</p></div>";
    }).join("");
    return { plain: "The estimate is last year's figure times (1 + trend). The replay also knows what really happened (the grey-free third bar), but the estimator is never allowed to look at it. That gap is the estimate error.",
      viz: '<div class="wk-two">' + cells + "</div>", calc: "estimate = same month last year &times; (1 + trend)" };
  }
  function pShare(x) {
    var hb = x.P.holdBack, fx = x.fixedShares, pl = x.planShares;
    var parts = pl.map(function (s, i) { return { v: s, fill: i ? C.b : C.a, dark: true, label: short(S.pair[i]).split(" ").pop() + " " + fmt(s * 100, 1) + "%" }; });
    parts.push({ v: 1 - pl[0] - pl[1], fill: "url(#wk-h)", label: "held back " + fmt((1 - pl[0] - pl[1]) * 100, 1) + "%" });
    var fparts = fx.map(function (s, i) { return { v: s, fill: i ? C.b : C.a, dark: true, label: short(S.pair[i]).split(" ").pop() + " " + fmt(s * 100, 1) + "%" }; });
    var rows = x.buyers.map(function (b, i) {
      return "<tr><td>" + short(S.pair[i]) + "</td><td>" + mwh(b.estimate, 0) + " &divide; " + mwh(x.expSolar, 0) + " &times; " + fmt(1 - hb, 2) + "</td><td><b>" + fmt(x.rawPlan[i] * 100, 1) + "%</b></td></tr>";
    }).join("");
    return { plain: "WattWise gives each buyer its estimate as a share of the solar <b>expected</b> that month (" + mwh(x.expSolar, 0) + " MWh, from the long-term PVGIS yield), minus a <b>" + fmt(hb * 100, 0) + "% hold-back</b>." +
      (x.scaled ? " The estimates add up to more than the solar, so the shares are scaled down." : " The estimates add up to less than the solar, so what is left over is held back too and sold via NEDA.") +
      " Today's fixed split instead repeats last year's yearly proportions.",
      viz: '<p class="wk-cap">WattWise shares</p>' + stack(parts, 1) + '<p class="wk-cap">Fixed split (what happens today)</p>' + stack(fparts, 1) +
        '<div class="yscroll"><table class="wk-tbl"><tr><th>Buyer</th><th>estimate &divide; expected solar &times; (1 &minus; hold-back)</th><th>Share</th></tr>' + rows + "</table></div>",
      calc: "share = estimate &divide; expected solar &times; (1 &minus; hold-back)" };
  }
  function pSolar(x) {
    var lt = INP.pv.kwh_per_kwp_long_term, y = INP.pv.kwh_per_kwp_by_month, exp = [], act = [];
    for (var m = 0; m < 12; m++) { exp.push(x.kwp * lt[m] / 1000); act.push(x.kwp * y["2017-" + (m < 9 ? "0" : "") + (m + 1)] / 1000); }
    return { plain: "The scheme is sized so its expected solar equals the buyers' use. <b>" + x.month + "</b>: " + mwh(x.expSolar, 0) + " MWh was expected when the shares were filed, and " + mwh(x.solar, 0) + " MWh actually arrived (real 2017 weather at Elmina). Settlement uses the actual figure.",
      viz: legend([["expected (filing day)", "#DCCFBF"], ["actual 2017", C.neda]]) + columns(MON.map(function (m) { return m.charAt(0); }), [{ vals: exp, color: "#DCCFBF" }, { vals: act, color: C.neda }], { hi: x.t - 12, vals: function (v) { return fmt(v, 0); } }),
      calc: "expected = kWp &times; long-term yield &nbsp;&middot;&nbsp; actual = kWp &times; this month's yield<br>" + fmt(x.kwp, 0) + " kWp (" + fmt(x.kwp / R.P.kwpPerRoof, 0) + " roofs at 5 kWp each)" };
  }
  function pSettle(x) {
    function one(label, s, col) {
      var parts = [{ v: s.tot.used, fill: col, dark: true, label: "used " + mwh(s.tot.used, 0) }, { v: s.tot.given, fill: C.given, dark: true, label: "given away " + mwh(s.tot.given, 0) }, { v: s.tot.neda, fill: "url(#wk-h)", label: "NEDA " + mwh(s.tot.neda, 0) }];
      var rows = s.rows.map(function (r, i) { return "<tr><td>" + short(S.pair[i]) + "</td><td>" + mwh(r.allocated, 1) + "</td><td>" + mwh(r.actual, 1) + "</td><td>" + mwh(r.used, 1) + "</td><td>" + mwh(r.given, 1) + "</td></tr>"; }).join("");
      return "<p class=\"wk-cap\"><b>" + label + "</b> &middot; " + mwh(s.tot.solar, 0) + " MWh of solar</p>" + stack(parts, s.tot.solar) +
        '<div class="yscroll"><table class="wk-tbl"><tr><th>Buyer</th><th>Allocated</th><th>Actually used</th><th>Paid use</th><th>Given away</th></tr>' + rows + "</table></div>";
    }
    return { plain: "When the month ends, each buyer's allocation (share &times; actual solar) is compared with what it really used. Use up to the allocation is <b>paid for</b>. Allocation beyond use is <b>given away</b> and earns nothing (CREAM 9.9). Solar nobody was allocated is <b>sold via NEDA</b> (9.7).",
      viz: one("Fixed split", x.fixed, C.fixed) + one("WattWise", x.plan, C.plan), calc: "used = min(allocated, actual use) &nbsp;&middot;&nbsp; given away = allocated &minus; use, if positive &nbsp;&middot;&nbsp; NEDA = solar &times; (1 &minus; sum of shares)  (MWh)" };
  }
  function pMoney(x) {
    var P = x.P, pr = x.price;
    function col(s) { return "<td>" + mwh(s.tot.used, 1) + " &times; " + fmt(pr, 2) + " = <b>RM" + fmt(s.tot.parts.used, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</b></td>"; }
    var cm = function (n) { return (n < 0 ? "&minus;" : "") + "RM" + fmt(Math.abs(n), 0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
    var rows = "<tr><td>Paid use &times; CREAM price (" + fmt(pr * 100, 0) + " sen)</td><td>" + cm(x.fixed.tot.parts.used) + "</td><td>" + cm(x.plan.tot.parts.used) + "</td></tr>" +
      "<tr><td>+ NEDA sales &times; 8 sen</td><td>" + cm(x.fixed.tot.parts.neda) + "</td><td>" + cm(x.plan.tot.parts.neda) + "</td></tr>" +
      "<tr><td>&minus; access charge 9 sen &times; (solar &minus; NEDA)</td><td>&minus;" + cm(x.fixed.tot.parts.cac) + "</td><td>&minus;" + cm(x.plan.tot.parts.cac) + "</td></tr>" +
      "<tr class=\"tot\"><td>Revenue for the month</td><td>" + cm(x.fixed.tot.revenue) + "</td><td>" + cm(x.plan.tot.revenue) + "</td></tr>" +
      "<tr class=\"tot\"><td>WattWise minus fixed split</td><td></td><td class=\"" + (x.plan.tot.revenue >= x.fixed.tot.revenue ? "rr-ok" : "rr-bad") + "\">" + cm(x.plan.tot.revenue - x.fixed.tot.revenue) + "</td></tr>";
    return { plain: "Money follows CREAM's rules. The CREAM price is private, so pick one: it changes the answer. At a low price, selling held-back solar via NEDA beats giving it away; at a high price, holding back solar a buyer would have paid for costs money.",
      viz: '<div class="yscroll"><table class="wk-tbl wk-money"><tr><th>' + x.month + " 2017</th><th>Fixed split</th><th>WattWise</th></tr>" + rows + "</table></div>",
      calc: "revenue = used &times; price + NEDA &times; 0.08 &minus; 0.09 &times; (solar &minus; NEDA)" };
  }
  function pYear(x, all) {
    var fx = all.map(function (m) { return m.fixed.tot.given / 1000; }), pl = all.map(function (m) { return m.plan.tot.given / 1000; });
    var upto = S.mi, rows = "", cf = 0, cp = 0, cs = 0, cn = 0, cr = 0;
    all.forEach(function (m, i) {
      if (i > upto) return;
      cf += m.fixed.tot.given; cp += m.plan.tot.given; cs += m.solar; cn += m.plan.tot.neda; cr += m.plan.tot.revenue - m.fixed.tot.revenue;
      rows += "<tr" + (i === upto ? ' class="cur"' : "") + "><td>" + m.month + "</td><td>" + mwh(m.solar, 1) + "</td><td>" + mwh(m.fixed.tot.given, 1) + "</td><td class=\"good\">" + mwh(m.plan.tot.given, 1) + "</td><td>" + mwh(m.plan.tot.neda, 1) + "</td><td>" + (m.plan.tot.revenue >= m.fixed.tot.revenue ? "" : "&minus;") + "RM" + fmt(Math.abs(m.plan.tot.revenue - m.fixed.tot.revenue), 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</td></tr>";
    });
    var done = upto === 11;
    rows += "<tr class=\"tot\"><td>" + (done ? "Year" : "So far") + "</td><td>" + mwh(cs, 1) + "</td><td>" + mwh(cf, 1) + " (" + fmt(cf / cs * 100, 2) + "%)</td><td class=\"good\">" + mwh(cp, 1) + " (" + fmt(cp / cs * 100, 2) + "%)</td><td>" + mwh(cn, 1) + "</td><td>" + (cr < 0 ? "&minus;" : "") + "RM" + fmt(Math.abs(cr), 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "</td></tr>";
    return { plain: "Do the same for every month and add them up. The tables are filled month by month: <b>" + MON[0] + " to " + MON[upto] + "</b> are in so far (use the month tabs above to add more). The year's <b>given away %</b> is total given away &divide; total solar.",
      viz: legend([["given away, fixed", C.fixed], ["given away, WattWise", C.plan]]) + columns(MON.map(function (m) { return m.charAt(0); }), [{ vals: fx, color: C.fixed }, { vals: pl, color: C.plan }], { hi: upto, dim: function (i) { return i > upto; }, vals: function (v) { return fmt(v, 0); } }) +
        '<div class="yscroll"><table class="wk-tbl"><tr><th>Month</th><th>Solar</th><th>Given away, fixed</th><th>Given away, WattWise</th><th>NEDA</th><th>Extra RM at ' + fmt(S.price, 0) + ' sen</th></tr>' + rows + '</table></div><p class="note" style="margin:0">MWh, except the last column (WattWise income minus fixed split).</p>',
      calc: "given away % = sum of given away &divide; sum of solar &times; 100" };
  }
  function pBench(x, all) {
    var sc = R.scores, W = 640, H = 156, pl = 8, MAXX = 25, out = "", beyond = 0;
    var X = function (v) { return pl + (W - 2 * pl) * Math.min(v, MAXX) / MAXX; };
    for (var g = 0; g <= MAXX; g += 5) out += '<line x1="' + X(g) + '" x2="' + X(g) + '" y1="10" y2="124" stroke="#ECE2D6"/>' + text(X(g), 142, g + "%" + (g === MAXX ? "+" : ""), { size: 11, anchor: g === MAXX ? "end" : g === 0 ? "start" : "middle" });
    var key = S.pair.join("|"), me = null, meIdx = -1;
    sc.forEach(function (s, i) { if (s.ids.join("|") === key) { me = s; meIdx = i; } });
    var jit = function (i) { return (((i * 37) % 23) - 11) * 1.9; };
    [["fixed", C.fixed, 44], ["plan", C.plan, 100]].forEach(function (row) {
      sc.forEach(function (s, i) {
        if (s[row[0]] > MAXX) beyond++;
        out += '<circle cx="' + X(s[row[0]]).toFixed(1) + '" cy="' + (row[2] + jit(i)).toFixed(1) + '" r="3" fill="' + row[1] + '" opacity=".5"/>';
      });
      var med = R.benchmark.two_buyer.given_away_median_pct[row[0]];
      out += '<line x1="' + X(med) + '" x2="' + X(med) + '" y1="' + (row[2] - 28) + '" y2="' + (row[2] + 28) + '" stroke="#15120F" stroke-width="2.5"/>' + text(X(med) + 7, row[2] - 31, "median " + fmt(med, 2) + "%", { anchor: "start", size: 12, fill: C.ink, weight: 800 });
      if (me) out += '<circle cx="' + X(me[row[0]]).toFixed(1) + '" cy="' + (row[2] + jit(meIdx)).toFixed(1) + '" r="7" fill="none" stroke="#15120F" stroke-width="2.5"/>';
      out += text(W - pl, row[2] + 4, row[0] === "fixed" ? "Fixed split" : "WattWise", { anchor: "end", size: 12, fill: C.ink, weight: 800 });
    });
    beyond = Math.round(beyond / 1);
    var sorted = sc.map(function (s) { return s.plan; }).sort(function (a, b) { return a - b; }), mid = Math.ceil((sorted.length + 1) / 2);
    var over = sc.filter(function (s) { return s.fixed > MAXX; }).length, overP = sc.filter(function (s) { return s.plan > MAXX; }).length;
    return { plain: "One scheme is just one example. The replay does exactly this for <b>all " + sc.length + " real two-buyer schemes</b>, and the headline number is the <b>median</b>: sort the " + sc.length + " results and take the middle one (the " + mid + "th). Each dot is one scheme's year; the ringed dots are the scheme you are watching (" + fmt(me ? me.fixed : 0, 2) + "% fixed, " + fmt(me ? me.plan : 0, 2) + "% WattWise).",
      viz: legend([["fixed split", C.fixed], ["WattWise", C.plan]]) + "<p class=\"wk-cap\">Share of the year’s solar given away, one dot per real scheme</p>" + svg(W, H, out) +
        '<p class="note" style="margin:2px 0 0">' + over + " fixed-split and " + overP + " WattWise results are beyond 25% and are drawn at the right edge.</p>" +
        '<div class="wk-facts"><div><b>' + fmt(R.benchmark.two_buyer.given_away_median_pct.fixed, 2) + "% &rarr; " + fmt(R.benchmark.two_buyer.given_away_median_pct.plan, 2) + '%</b><span>median, fixed &rarr; WattWise</span></div><div><b>' + fmt(R.benchmark.two_buyer.plan_gives_away_less_than_fixed_pct, 1) + '%</b><span>of schemes give away less than fixed</span></div><div><b>' + fmt(R.benchmark.two_buyer.plan_gives_away_less_than_copy_pct, 1) + '%</b><span>give away less than copying last year</span></div></div>',
      calc: "median = the middle value of the " + sc.length + " schemes' results, sorted" };
  }

  // ---------- code pane
  function renderCode(step, x) {
    var L = window.WALK_CODE, st = STEPS[step], a = -1, b = -1;
    L.forEach(function (l, i) { if (a < 0 && l.t.indexOf(st.code[0]) >= 0) a = i; });
    for (var i = Math.max(a, 0); i < L.length; i++) { if (L[i].t.indexOf(st.code[1]) >= 0) { b = i; break; } }
    if (st.code[0].indexOf("def revenue") === 0) { b = L.findIndex(function (l, i) { return i > a && l.t.indexOf("return tot") >= 0; }); }
    if (b < a) b = a;
    var html = "";
    L.forEach(function (l, i) {
      if (l.n === null) { html += '<div class="ln gap"></div>'; return; }
      html += '<div class="ln' + (i >= a && i <= b ? " on" : "") + '" data-i="' + i + '"><span class="no">' + l.n + '</span><span class="tx">' + l.t.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span></div>";
    });
    $("wk-code").innerHTML = html;
    var on = $("wk-code").querySelector(".ln.on");
    if (on) { var box = $("wk-code"); box.scrollTop = Math.max(0, on.offsetTop - box.offsetTop - 40); }
  }

  // ---------- render
  function render() {
    if (!S.ready) return;
    var x = trace(), all = (S.step === 7 || S.step === 8) ? allMonths() : null, st = STEPS[S.step];
    var fn = [pRead, pTrend, pEst, pShare, pSolar, pSettle, pMoney, pYear, pBench][S.step], p = fn(x, all);
    $("wk-title").innerHTML = "<span>" + (S.step + 1) + "</span>" + st.name + (S.step < 7 ? " &middot; " + x.month + " 2017" : "");
    $("wk-plain").innerHTML = p.plain;
    $("wk-viz").innerHTML = p.viz;
    $("wk-calc").innerHTML = p.calc;
    document.querySelectorAll("#wk-steps button").forEach(function (b, i) { b.classList.toggle("on", i === S.step); b.classList.toggle("done", i < S.step); });
    document.querySelectorAll("#wk-months button").forEach(function (b, i) { b.classList.toggle("on", i === S.mi); b.disabled = S.step > 6 && S.step !== 7; });
    $("wk-prev").disabled = S.step === 0 && S.mi === 0; $("wk-next").disabled = S.step === 8 && S.mi === 11;
    renderCode(S.step, x);
  }
  function stop() { if (S.timer) { clearInterval(S.timer); S.timer = null; $("wk-play").textContent = "Play"; } }
  function next() {
    if (S.step < 6) S.step++; else if (S.step === 6 && S.mi < 11) { S.mi++; S.step = 0; } else if (S.step === 6) S.step = 7; else if (S.step === 7) S.step = 8; else { stop(); return; }
    render();
  }
  function prev() { if (S.step > 0 && S.step !== 7) S.step--; else if (S.step === 7) S.step = 6; else if (S.mi > 0) { S.mi--; S.step = 6; } render(); }

  function start() {
    if (S.started) return;
    S.started = true;
    load().then(function () {
      S.ready = true;
      var ex = D.settlement.example_buildings;
      S.pair = ex.slice();
      $("wk-pair").innerHTML = R.pairs.map(function (p) { return '<option value="' + p.join("|") + '">' + p[0].split("_")[0] + ": " + p.map(short).join(" + ") + (p.join("|") === ex.join("|") ? " (the Appendix A example)" : "") + "</option>"; }).join("");
      $("wk-pair").value = ex.join("|");
      $("wk-months").innerHTML = MON.map(function (m, i) { return '<button type="button" data-i="' + i + '">' + m + "</button>"; }).join("");
      $("wk-steps").innerHTML = STEPS.map(function (s, i) { return '<button type="button" data-i="' + i + '"><i>' + (i + 1) + "</i>" + s.name + "</button>"; }).join("");
      $("wk-months").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && !b.disabled) { stop(); S.mi = +b.dataset.i; if (S.step > 7) S.step = 7; render(); } });
      $("wk-steps").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { stop(); S.step = +b.dataset.i; render(); } });
      $("wk-pair").addEventListener("change", function () { stop(); S.pair = this.value.split("|"); render(); });
      $("wk-price").addEventListener("change", function () { S.price = +this.value; render(); });
      $("wk-prev").addEventListener("click", function () { stop(); prev(); });
      $("wk-next").addEventListener("click", function () { stop(); next(); });
      $("wk-play").addEventListener("click", function () {
        if (S.timer) { stop(); return; }
        $("wk-play").textContent = "Pause"; next();
        S.timer = setInterval(next, 2600);
      });
      $("wk-status").textContent = "";
      render();
    }).catch(function (e) { $("wk-status").textContent = "Could not load the inputs (" + e.message + "). Open this page from a web server, not as a file."; });
  }
  window.WattWiseWalk = { open: function () { if (!S.ready) start(); } };
  document.addEventListener("DOMContentLoaded", function () { if ($("page-w") && $("page-w").classList.contains("on")) start(); });
})();
