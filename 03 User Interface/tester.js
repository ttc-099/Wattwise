/* "Test it yourself" panels for Appendix A to D.
   Each panel lets a judge enter their own inputs and runs the same replay (replay.js, a port of replay.py)
   in the browser. Nothing is uploaded. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var fmt = WWReplay.fmt, MON = WWReplay.MON;
  var C = { fixed: "#B7AA9C", copy: "#5E5048", plan: "#F7931E", neda: "#F9B915", ink: "#15120F", muted: "#5E5048" };
  var INP = null, loading = null;

  function load() {
    if (INP) return Promise.resolve(INP);
    if (loading) return loading;
    loading = Promise.all([fetch("data/replay/bdg2_buildings.csv").then(function (r) { return r.text(); }),
                           fetch("data/replay/bdg2_monthly_kwh.csv").then(function (r) { return r.text(); }),
                           fetch("data/replay/pvgis_elmina.json").then(function (r) { return r.json(); })])
      .then(function (x) { INP = WWReplay.load(x[0], x[1], x[2]); return INP; });
    return loading;
  }
  var esc = function (t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
  var rm = function (x) { return (x < 0 ? "&minus;RM" : "RM") + fmt(Math.abs(x), 0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
  var num = function (id, dflt) { var v = parseFloat($(id).value); return isFinite(v) ? v : dflt; };
  var busy = function (out, msg) { out.innerHTML = '<p class="note">' + (msg || "Running…") + "</p>"; };
  function later(fn) { setTimeout(fn, 20); }
  function fail(out, e) { out.innerHTML = '<p class="tst-err">' + esc(e.message || e) + "</p>"; }

  // ---------- small SVG column chart
  function columns(groups, series, opts) {
    opts = opts || {};
    var W = 640, H = opts.h || 190, pl = 6, pb = 24, pt = 20, gw = (W - pl) / groups.length, bw = Math.min(30, (gw - 6) / series.length);
    var max = opts.max || Math.max.apply(null, [].concat.apply([], series.map(function (s) { return s.vals; }))) || 1, out = "";
    groups.forEach(function (g, i) {
      var x0 = pl + i * gw + (gw - bw * series.length) / 2;
      series.forEach(function (s, k) {
        var h = (H - pt - pb) * (s.vals[i] / max);
        out += '<rect x="' + (x0 + k * bw).toFixed(1) + '" y="' + (H - pb - h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + Math.max(h, 0).toFixed(1) + '" rx="3" fill="' + s.color + '"/>';
        if (opts.labels) out += '<text x="' + (x0 + k * bw + (bw - 2) / 2).toFixed(1) + '" y="' + (H - pb - h - 4).toFixed(1) + '" font-size="11" font-weight="700" text-anchor="middle" fill="' + C.ink + '">' + opts.labels(s.vals[i]) + "</text>";
      });
      out += '<text x="' + (pl + i * gw + gw / 2).toFixed(1) + '" y="' + (H - 7) + '" font-size="11" text-anchor="middle" fill="' + C.muted + '">' + g + "</text>";
    });
    return '<svg class="wk-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-hidden="true">' + out + "</svg>";
  }
  var legend = function (items) { return '<div class="wk-lg">' + items.map(function (i) { return '<span><i style="background:' + i[1] + '"></i>' + i[0] + "</span>"; }).join("") + "</div>"; };
  var tile = function (big, small, cls) { return '<div class="tst-tile' + (cls ? " " + cls : "") + '"><b>' + big + "</b><span>" + small + "</span></div>"; };

  // ---------- panel markup
  function panel(id, title, intro, controls, extra) {
    return '<div class="card tester" id="tst-' + id + '"><h2 style="margin-top:0">Test it yourself: ' + title + '</h2><p class="note" style="margin-top:0">' + intro + "</p>" +
      '<div class="tst-grid">' + controls + '</div><div class="tst-go"><button class="btn primary" id="tst-' + id + '-run" type="button">Run the test</button>' + (extra || "") +
      '<span class="note" id="tst-' + id + '-msg"></span></div><div id="tst-' + id + '-out" class="tst-out" aria-live="polite"></div></div>';
  }
  var ctl = {
    range: function (id, label, min, max, step, val, unit) { return '<label>' + label + ' <output id="' + id + '-o">' + val + unit + '</output><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></label>'; },
    number: function (id, label, val, min, max, step) { return '<label>' + label + '<input type="number" id="' + id + '" value="' + val + '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '"></label>'; },
    select: function (id, label, opts, val) { return '<label>' + label + '<select id="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>"; }
  };
  function bindRange(id, unit) { var el = $(id); if (el) el.addEventListener("input", function () { $(id + "-o").textContent = el.value + unit; }); }

  // ================= A: your own buyers
  function parseUse(text) {
    var rows = [], labelRe = /^([A-Za-z]|\d{4}-\d{2}$)/;
    text.split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var tok = line.split(/[,;\t ]+/).filter(Boolean);
      if (tok.length && labelRe.test(tok[0]) && !/^[-+]?\d+(\.\d+)?$/.test(tok[0])) tok.shift();      // month label column
      var vals = tok.map(parseFloat);
      if (vals.some(function (v) { return !isFinite(v); })) { if (!rows.length) return; throw new Error("Row " + (rows.length + 1) + " has something that is not a number."); }
      if (vals.length) rows.push(vals);
    });
    return rows;
  }
  function toLoads(rows) {
    if (rows.length !== 24) throw new Error("Enter exactly 24 monthly rows: January 2016 to December 2017 (you have " + rows.length + "). The first 12 are last year, the last 12 are the year being planned.");
    var nb = rows[0].length;
    if (nb < 1 || nb > 5) throw new Error("Use 1 to 5 buyers (columns).");
    rows.forEach(function (r, i) { if (r.length !== nb) throw new Error("Row " + (i + 1) + " has " + r.length + " values, expected " + nb + "."); r.forEach(function (v) { if (!(v > 0)) throw new Error("Row " + (i + 1) + ": every month must be above 0 MWh."); }); });
    var loads = [];
    for (var b = 0; b < nb; b++) loads.push(rows.map(function (r) { return r[b]; }));
    return loads;
  }
  function exampleText() {
    var ex = D.settlement.example_buildings, prep = WWReplay.prepare(INP), P = WWReplay.DEFAULTS;
    var loads = WWReplay.scaleLoads(ex.map(function (b) { return prep.good[b]; }), P).map(function (u) { return u.map(function (v) { return v / 1000; }); });
    var lines = ["month," + ex.map(function (b) { return b.replace(/^[A-Za-z]+_/, ""); }).join(",")];
    for (var i = 0; i < 24; i++) lines.push((i < 12 ? "2016-" : "2017-") + ("0" + ((i % 12) + 1)).slice(-2) + "," + loads.map(function (u) { return u[i].toFixed(1); }).join(","));
    return lines.join("\n");
  }
  function addBuilding(id) {
    var prep = WWReplay.prepare(INP), v = prep.good[id] || INP.use[id];
    if (!v || v.some(function (x) { return x === null; })) throw new Error("'" + id + "' is not a building with complete 2016 and 2017 data. Start typing to see valid ids.");
    var rows = $("tst-a-data").value.trim() ? parseUse($("tst-a-data").value) : [];
    if (rows.length && rows.length !== 24) throw new Error("Fix the table first: it needs 24 rows.");
    if (rows.length && rows[0].length >= 5) throw new Error("Five buyers is the maximum.");
    var lines = [], head = ["month"];
    for (var i = 0; i < 24; i++) lines.push((i < 12 ? "2016-" : "2017-") + ("0" + ((i % 12) + 1)).slice(-2) + "," + (rows.length ? rows[i].join(",") + "," : "") + (v[i] / 1000).toFixed(1));
    $("tst-a-data").value = "month," + (rows.length ? rows[0].map(function (_, k) { return "buyer" + (k + 1); }).join(",") + "," : "") + id.replace(/^[A-Za-z]+_/, "") + "\n" + lines.join("\n");
  }
  function runA() {
    var out = $("tst-a-out"); busy(out);
    later(function () {
      try {
        var loads = toLoads(parseUse($("tst-a-data").value));
        var hb = num("tst-a-hb", 2) / 100, price = num("tst-a-price", 25) / 100, ratio = num("tst-a-ratio", 1);
        if (!(ratio > 0.2 && ratio <= 3)) throw new Error("Scheme size must be between 0.2 and 3 times the buyers' use.");
        var r = WWReplay.customScheme(loads, INP.pv, { holdBack: hb, price: price, ratio: ratio });
        var t = r.res, solar = t.fixed[1].solar / 1000;
        var pctOf = function (p) { return t[p][1].given / t[p][1].solar * 100; };
        var html = '<div class="tst-tiles">' +
          tile(fmt(pctOf("fixed"), 2) + "%", "given away, fixed split<br>" + fmt(t.fixed[1].given / 1000, 1) + " MWh") +
          tile(fmt(pctOf("copy"), 2) + "%", "given away, copy last year<br>" + fmt(t.copy[1].given / 1000, 1) + " MWh") +
          tile(fmt(pctOf("plan"), 2) + "%", "given away, WattWise<br>" + fmt(t.plan[1].given / 1000, 1) + " MWh", "good") + "</div>" +
          '<p class="tst-line">Scheme: <b>' + fmt(r.kwp, 0) + " kWp</b> of rooftop solar (" + fmt(solar, 0) + " MWh in 2017) for " + loads.length + " buyer" + (loads.length > 1 ? "s" : "") +
          ". At " + fmt(price * 100, 0) + " sen/kWh WattWise earns <b>" + rm(r.money.plan - r.money.fixed) + "</b> a year " + (r.money.plan >= r.money.fixed ? "more" : "less") + " than the fixed split and <b>" + rm(r.money.plan - r.money.copy) + "</b> versus copying last year" +
          (price < 0.17 ? ' <span class="mod">(below the 17 sen break-even, where NEDA beats selling to a buyer)</span>' : "") + ".</p>" +
          legend([["Fixed split", C.fixed], ["WattWise", C.plan]]) +
          columns(MON.map(function (m) { return m.charAt(0); }), [{ vals: r.months.map(function (m) { return m.fixed_given / 1000; }), color: C.fixed }, { vals: r.months.map(function (m) { return m.plan_given / 1000; }), color: C.plan }], { labels: function (v) { return v >= 1 ? fmt(v, 0) : ""; } });
        var rows = "<tr><th>Month 2017</th><th>Solar</th><th>Estimate</th><th>Actual use</th><th>Error</th><th>Given away, fixed</th><th>Given away, WattWise</th><th>Sold via NEDA</th></tr>";
        r.months.forEach(function (m) {
          var est = m.estimates.reduce(function (a, b) { return a + b; }, 0) / 1000, act = m.actual.reduce(function (a, b) { return a + b; }, 0) / 1000;
          rows += "<tr><td>" + m.month + "</td><td>" + fmt(m.solar / 1000, 1) + "</td><td>" + fmt(est, 1) + "</td><td>" + fmt(act, 1) + "</td><td>" + fmt((est - act) / act * 100, 1) + "%</td><td>" + fmt(m.fixed_given / 1000, 1) + '</td><td class="good">' + fmt(m.plan_given / 1000, 1) + "</td><td>" + fmt(m.plan_neda / 1000, 1) + "</td></tr>";
        });
        html += '<div class="yscroll"><table class="wk-tbl">' + rows + "</table></div><p class=\"note\">MWh. Estimate = last year's same month × (1 + trend) summed over buyers, made 120 days ahead. Same rules as replay.py.</p>";
        out.innerHTML = html; $("tst-a-msg").textContent = "";
      } catch (e) { fail(out, e); }
    });
  }

  // ================= B: money
  function runB() {
    var out = $("tst-b-out"); busy(out, "Running 400+ real schemes…");
    later(function () {
      try {
        var roofs = num("tst-b-roofs", 6000), price = Math.round(num("tst-b-price", 25)) / 100, n = Math.round(num("tst-b-n", 2));
        var neda = num("tst-b-neda", 8) / 100, cac = num("tst-b-cac", 9) / 100, hb = num("tst-b-hb", 2) / 100;
        if (!(roofs >= 100 && roofs <= 100000)) throw new Error("Houses must be between 100 and 100,000.");
        var list = [0.15, 0.20, 0.25, 0.30, 0.35, 0.40]; if (list.map(function (x) { return x.toFixed(2); }).indexOf(price.toFixed(2)) < 0) list.push(price);
        list.sort(function (a, b) { return a - b; });
        var b = WWReplay.benchN(INP, n, { price: price, priceList: list, neda: neda, cac: cac, holdBack: hb });
        if (!b) throw new Error("No real schemes with " + n + " buyers.");
        var mwh = roofs * WWReplay.DEFAULTS.kwpPerRoof * INP.pv.kwh_per_kwp_long_term.reduce(function (a, c) { return a + c; }, 0) / 1000, key = b.price_key;
        var gain = b.gain_fixed * mwh, inc = b.income_fixed * mwh, gc = b.gain_copy * mwh;
        var html = '<div class="tst-tiles">' + tile(rm(gain), "extra a year vs a fixed split", gain >= 0 ? "good" : "bad") + tile(inc > 0 ? fmt(gain / inc * 100, 1) + "%" : "n/a", "of scheme income after the access charge (" + rm(inc) + ")") + tile(rm(gc), "extra a year vs copying last year", gc >= 0 ? "" : "bad") + "</div>" +
          '<p class="tst-line">' + fmt(roofs, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " houses ≈ <b>" + fmt(mwh, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " MWh</b> of solar a year, " + n + " buyer" + (n > 1 ? "s" : "") + ", median of " + b.n_groups + " real schemes. WattWise earned more than a fixed split in <b>" + fmt(b.earns_more_pct, 1) + "%</b> of them at this price. " +
          (price < neda + cac ? '<span class="mod">At ' + fmt(price * 100, 0) + " sen a buyer pays less than NEDA (" + fmt((neda + cac) * 100, 0) + " sen break-even), so extra hold-back looks better than it is.</span>" : "Break-even against NEDA is " + fmt((neda + cac) * 100, 0) + " sen.") + "</p>" +
          legend([["Extra income a year by CREAM price", C.plan]]);
        out.innerHTML = html + columns(list.map(function (p) { return fmt(p * 100, 0) + " sen"; }), [{ vals: list.map(function (p) { return Math.max(b.plan_gain_vs_fixed_rm_per_mwh_median[String(Math.round(p * 100))] * mwh / 1000, 0); }), color: C.plan }], { labels: function (v) { return "RM" + fmt(v, 0) + "k"; } }) +
          '<p class="note">Bars show the extra income at each price for the same houses and buyers; negative values are drawn as zero.</p>';
        $("tst-b-msg").textContent = "";
      } catch (e) { fail(out, e); }
    });
  }

  // ================= C: scheme size
  function runC() {
    var out = $("tst-c-out"); busy(out, "Running 400+ real schemes…");
    later(function () {
      try {
        var ratio = Math.round(num("tst-c-ratio", 1.2) * 100) / 100, n = Math.round(num("tst-c-n", 2)), hb = num("tst-c-hb", 2) / 100;
        var list = [1.1, 1.2, 1.5, 2.0]; if (ratio !== 1 && list.indexOf(ratio) < 0) list.push(ratio); list.sort();
        var b = WWReplay.benchN(INP, n, { price: 0.25, ratio: ratio, ratioList: list, holdBack: hb });
        if (!b) throw new Error("No real schemes with " + n + " buyers.");
        var o = ratio === 1 ? null : b.oversize[String(ratio)], fixed0 = b.given_away_median_pct.fixed, plan0 = b.given_away_median_pct.plan;
        var html = '<div class="tst-tiles">' + tile(fmt(o ? o.fixed : fixed0, 2) + "%", "given away, fixed split at " + fmt(ratio, 1) + "× size") + tile(fmt(o ? o.plan : plan0, 2) + "%", "given away, WattWise at " + fmt(ratio, 1) + "× size", "good") +
          tile(o ? fmt(o.extra_solar_to_neda_pct, 0) + "%" : "n/a", "of the extra solar sold via NEDA at 8 sen") + "</div>" +
          '<p class="tst-line">Median of ' + b.n_groups + " real " + n + "-buyer schemes, solar sized at " + fmt(ratio, 1) + "× the buyers' use. " + (o ? "WattWise was no worse than a fixed split at today's size in <b>" + fmt(o.plan_no_worse_than_fixed_at_1x_pct, 1) + "%</b> of schemes. " : "") +
          "Feeder limits (2 MWp each), roof availability and lease take-up are not modelled.</p>" + legend([["Fixed split", C.fixed], ["WattWise", C.plan]]);
        var cats = ["1.0×"].concat(list.map(function (x) { return fmt(x, 1) + "×"; })), fx = [fixed0], pl = [plan0];
        list.forEach(function (x) { fx.push(b.oversize[String(x)].fixed); pl.push(b.oversize[String(x)].plan); });
        out.innerHTML = html + columns(cats, [{ vals: fx, color: C.fixed }, { vals: pl, color: C.plan }], { labels: function (v) { return fmt(v, 1) + "%"; } }); $("tst-c-msg").textContent = "";
      } catch (e) { fail(out, e); }
    });
  }

  // ================= D: win rates
  function runD() {
    var out = $("tst-d-out"); busy(out, "Running real schemes…");
    later(function () {
      try {
        var n = Math.round(num("tst-d-n", 2)), site = $("tst-d-site").value, hb = num("tst-d-hb", 2) / 100, price = Math.round(num("tst-d-price", 25)) / 100;
        var b = WWReplay.benchN(INP, n, { price: price, holdBack: hb }, site === "all" ? null : [site]);
        if (!b) throw new Error("There are no " + n + "-buyer schemes at that site: try fewer buyers or all sites.");
        var g = b.given_away_median_pct;
        out.innerHTML = '<div class="tst-tiles">' + tile(fmt(g.fixed, 2) + "%", "median given away, fixed split") + tile(fmt(g.copy_last_year, 2) + "%", "copy last year") + tile(fmt(g.plan, 2) + "%", "WattWise", "good") + "</div>" +
          '<p class="tst-line">' + b.n_groups + " real " + n + "-buyer scheme" + (b.n_groups > 1 ? "s" : "") + ": WattWise gave away less than a fixed split in <b>" + fmt(b.plan_gives_away_less_than_fixed_pct, 1) + "%</b>, and less than copying last year in <b>" + fmt(b.plan_gives_away_less_than_copy_pct, 1) +
          "%</b>. On money at " + fmt(price * 100, 0) + " sen it earned " + fmt(b.gain_fixed, 2) + " RM/MWh more than fixed and " + fmt(Math.abs(b.gain_copy), 2) + " RM/MWh " + (b.gain_copy >= 0 ? "more" : "less") + " than copying last year. Median monthly estimate error " + fmt(b.estimate_error_pct.median_month, 1) + "%, a buyer's worst month " + fmt(b.estimate_error_pct.worst_month_median, 1) + "%.</p>" +
          legend([["Fixed split", C.fixed], ["Copy last year", C.copy], ["WattWise", C.plan]]) + columns(["Median given away"], [{ vals: [g.fixed], color: C.fixed }, { vals: [g.copy_last_year], color: C.copy }, { vals: [g.plan], color: C.plan }], { labels: function (v) { return fmt(v, 2) + "%"; }, h: 150 }) +
          legend([["Less than fixed", "#F9B915"], ["Less than copy last year", C.plan]]) + columns(["Share of schemes where WattWise gives away less"], [{ vals: [b.plan_gives_away_less_than_fixed_pct], color: "#F9B915" }, { vals: [b.plan_gives_away_less_than_copy_pct], color: C.plan }], { labels: function (v) { return fmt(v, 1) + "%"; }, max: 118, h: 150 });
        $("tst-d-msg").textContent = "";
      } catch (e) { fail(out, e); }
    });
  }

  // ---------- build the panels
  function mount() {
    var A = panel("a", "your own buyers",
      "Paste each buyer's monthly electricity use in MWh: 24 rows (January 2016 to December 2017), one column per buyer (up to 5). The first 12 months are last year; WattWise plans the last 12 from them, 120 days ahead. Then compare a fixed split, copying last year and WattWise on your data.",
      '<label class="tst-wide">Monthly use, MWh<textarea id="tst-a-data" rows="12" spellcheck="false" placeholder="month,buyer1,buyer2&#10;2016-01,250.0,610.0&#10;2016-02,240.5,590.2&#10;..."></textarea></label>' +
      '<div class="tst-side">' + ctl.range("tst-a-hb", "Hold-back", 0, 15, 0.5, 2, "%") + ctl.number("tst-a-price", "CREAM price (sen/kWh)", 25, 10, 50, 1) + ctl.number("tst-a-ratio", "Scheme size (× the buyers' use)", 1, 0.5, 2, 0.1) +
      '<label>Add a real building<input list="tst-ids" id="tst-a-id" placeholder="e.g. Bull_office_Lilla"></label><datalist id="tst-ids"></datalist></div>',
      '<button class="btn" id="tst-a-ex" type="button">Load the example</button><button class="btn" id="tst-a-add" type="button">Add the building</button><button class="btn" id="tst-a-clear" type="button">Clear</button>');
    var B = panel("b", "the money",
      "Choose a scheme size, buyers, CREAM price and the rules, and see the extra income WattWise would add over a fixed split, measured on real buildings and scaled to your solar.",
      '<div class="tst-side">' + ctl.number("tst-b-roofs", "Houses (5 kWp each)", 6000, 100, 100000, 100) + ctl.range("tst-b-price", "CREAM price", 10, 45, 1, 25, " sen") + ctl.select("tst-b-n", "Buyers", [[1, "1"], [2, "2"], [5, "5"], [10, "10"], [20, "20"]], 2) + "</div>" +
      '<div class="tst-side">' + ctl.range("tst-b-hb", "Hold-back", 0, 15, 0.5, 2, "%") + ctl.number("tst-b-neda", "NEDA rate (sen/kWh)", 8, 1, 30, 1) + ctl.number("tst-b-cac", "Access charge (sen/kWh)", 9, 0, 30, 1) + "</div>");
    var Cp = panel("c", "a bigger scheme",
      "Build the scheme larger than the buyers' use and see how much solar each method gives away, and how much of the extra sells via NEDA.",
      '<div class="tst-side">' + ctl.range("tst-c-ratio", "Scheme size (× buyers' use)", 1, 2, 0.05, 1.2, "×") + ctl.select("tst-c-n", "Buyers", [[1, "1"], [2, "2"], [5, "5"], [10, "10"]], 2) + ctl.range("tst-c-hb", "Hold-back", 0, 15, 0.5, 2, "%") + "</div>");
    var Dp = panel("d", "win rates",
      "Pick how many buyers share the scheme and where the buildings are, and see how often WattWise gives away less than the alternatives.",
      '<div class="tst-side">' + ctl.range("tst-d-n", "Buyers per scheme", 1, 20, 1, 2, "") + ctl.select("tst-d-site", "Buildings", [["all", "All 11 sites"], ["Bull", "Humid Texas site only"]], "all") + "</div>" +
      '<div class="tst-side">' + ctl.range("tst-d-hb", "Hold-back", 0, 15, 0.5, 2, "%") + ctl.range("tst-d-price", "CREAM price", 10, 45, 1, 25, " sen") + "</div>");
    var host = function (page, html) { var el = document.querySelector("#page-" + page + " .ctr"); if (el) el.insertAdjacentHTML("afterend", html); };
    host("a", A); host("b", B); host("c", Cp); host("d", Dp);
    ["tst-a-hb|%", "tst-b-price| sen", "tst-b-hb|%", "tst-c-ratio|×", "tst-c-hb|%", "tst-d-n|", "tst-d-hb|%", "tst-d-price| sen"].forEach(function (x) { var p = x.split("|"); bindRange(p[0], p[1]); });
    [["a", runA], ["b", runB], ["c", runC], ["d", runD]].forEach(function (x) {
      $("tst-" + x[0] + "-run").addEventListener("click", function () { load().then(x[1]).catch(function (e) { fail($("tst-" + x[0] + "-out"), "Could not load the data (" + e.message + "). Open this page from a web server, not as a file."); }); });
    });
    $("tst-a-ex").addEventListener("click", function () { load().then(function () { $("tst-a-data").value = exampleText(); runA(); }); });
    $("tst-a-clear").addEventListener("click", function () { $("tst-a-data").value = ""; $("tst-a-out").innerHTML = ""; });
    $("tst-a-add").addEventListener("click", function () { load().then(function () { try { addBuilding($("tst-a-id").value.trim()); $("tst-a-msg").textContent = ""; } catch (e) { fail($("tst-a-out"), e); } }); });
    $("tst-a-id").addEventListener("focus", function () {
      load().then(function () { var dl = $("tst-ids"); if (!dl.children.length) dl.innerHTML = Object.keys(WWReplay.prepare(INP).good).sort().map(function (b) { return '<option value="' + b + '">'; }).join(""); });
    });
  }
  mount();
})();
