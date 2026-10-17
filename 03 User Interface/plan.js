/* plan.js - cream allocation pages for the wattwise dashboard
   data: data/plan.json, built from the repo's real result files */

window.addEventListener("unhandledrejection", function (e) {
  var t = document.getElementById("plan-kpis");
  if (t) t.setAttribute("data-rej", String(e.reason && e.reason.message || e.reason).slice(0, 160));
});
window.addEventListener("error", function (e) {
  // surface any main-world error in the dom (console runs isolated)
  var t = document.getElementById("plan-kpis");
  if (t) t.setAttribute("data-err", (e.message || "error").slice(0, 120));
});

var PLAN = null;
var PLAN_PAGES = { "page-plan": 1, "page-estimate": 1, "page-allocate": 1, "page-settle": 1 };

function planFmt(v, dp) { return v.toLocaleString("en-MY", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); }

function kpi(lbl, val, sub) { return '<div class="kpi"><div class="lbl">' + lbl + '</div><div class="val">' + val + '</div><div class="dlt">' + sub + "</div></div>"; }
function flow(lbl, val, cls) { return "<div><div class=\"big" + (cls === "good" ? " done" : cls === "bad" ? " warn" : "") + "\">" + val + '</div><div class="lab">' + lbl + "</div></div>"; }

function planBars(canvasId, labels, series, yLabel) {
  var cv = document.getElementById(canvasId);
  if (!cv) return;
  var w = cv.parentElement.clientWidth - 24, h = cv.height;
  cv.width = w; cv.height = h;
  var x = cv.getContext("2d");
  var pad = { l: 52, r: 12, t: 14, b: 30 };
  var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  var max = 0;
  series.forEach(function (s) { s.values.forEach(function (v) { if (v > max) max = v; }); });
  max = Math.max(max * 1.15, 1);
  x.font = "11px Calibri, Segoe UI, sans-serif";
  x.clearRect(0, 0, w, h);
  x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, w, h);
  x.strokeStyle = "#D9D9D9"; x.fillStyle = "#404040";
  for (var g = 0; g <= 4; g++) {
    var gy = pad.t + ih - (ih * g / 4);
    x.beginPath(); x.moveTo(pad.l, gy); x.lineTo(w - pad.r, gy); x.stroke();
    x.textAlign = "right"; x.textBaseline = "middle";
    x.fillText(planFmt(max * g / 4, max < 10 ? 1 : 0), pad.l - 6, gy);
  }
  var n = labels.length, gw = iw / n, bw = Math.min((gw - 8) / series.length, 26);
  labels.forEach(function (lb, i) {
    x.fillStyle = "#404040"; x.textAlign = "center"; x.textBaseline = "top";
    x.fillText(lb, pad.l + gw * i + gw / 2, pad.t + ih + 7);
    series.forEach(function (s, si) {
      var v = s.values[i];
      if (v <= 0) return;
      var bh = ih * v / max;
      var bx = pad.l + gw * i + 4 + si * bw;
      x.fillStyle = s.color;
      x.fillRect(bx, pad.t + ih - bh, bw - 2, bh);
    });
  });
  x.fillStyle = "#404040"; x.textAlign = "left"; x.textBaseline = "top";
  x.fillText(yLabel, pad.l, 2);
}

function renderPlanKpis() {
  var s = PLAN.settlement, t = s.totals;
  document.getElementById("plan-kpis").innerHTML =
    kpi("Given away &middot; fixed split", planFmt(t.fixed.given_away_mwh) + " MWh", "per year &middot; " + t.fixed.pct + "% of generation") +
    kpi("Given away &middot; with Plan", planFmt(t.plan.given_away_mwh) + " MWh", "per year &middot; " + t.plan.pct + "% of generation") +
    kpi("Kept from giveaway", planFmt(s.kept_mwh) + " MWh", "+RM" + planFmt(s.income_gain_rm[0]) + "&ndash;" + planFmt(s.income_gain_rm[1]) + "/yr at assumed 15&ndash;30 sen") +
    kpi("Held back for NEDA sale", planFmt(t.plan.neda) + " MWh", "sold at the floor, not given away");
  document.getElementById("plan-flows").innerHTML =
    flow("Generation", planFmt(9409)) +
    flow("Delivered &middot; fixed", planFmt(t.fixed.delivered)) +
    flow("Delivered &middot; plan", planFmt(t.plan.delivered)) +
    flow("Given away &middot; fixed", planFmt(t.fixed.given_away_mwh), "bad") +
    flow("Given away &middot; plan", planFmt(t.plan.given_away_mwh), "good");
  planBars("chart-plan-replay", s.months, [
    { color: "#7F7F7F", values: s.fixed },
    { color: "#2E7D6B", values: s.plan }
  ], "MWh given away per month");
  var rows = '<tr><th>Buyers</th><th>Scheme kWp</th><th>Fixed %</th><th>Plan %</th><th>Kept MWh/yr</th><th>Gain RM/yr</th></tr>';
  PLAN.buyer_mix.forEach(function (b) {
    rows += "<tr><td>" + b.buyers.join(" + ") + "</td><td class=\"num\">" + planFmt(b.scheme_kwp) + "</td><td class=\"num\">" + b.given_away_pct_fixed + "</td><td class=\"num\">" + b.given_away_pct_plan + "</td><td class=\"num\">" + planFmt(b.kept_for_residents_mwh) + "</td><td class=\"num\">" + planFmt(b.plan_income_gain_rm[0]) + "&ndash;" + planFmt(b.plan_income_gain_rm[1]) + "</td></tr>";
  });
  document.getElementById("plan-register").innerHTML = rows;
}

function renderEstimate() {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var now = new Date(), rows = '<tr><th>Allocation month</th><th>Notice deadline (120 days)</th><th>Basis</th></tr>';
  for (var i = 1; i <= 4; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    var notice = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 120);
    rows += "<tr><td>" + months[d.getMonth()] + " " + d.getFullYear() + "</td><td>" + notice.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) + "</td><td>Same month last year &times; (1 + trend), buyers&rsquo; own meters</td></tr>";
  }
  document.getElementById("plan-runway").innerHTML = rows;
}

function renderAllocate() {
  var t = PLAN.settlement.totals;
  document.getElementById("alloc-kpis").innerHTML =
    kpi("Delivered to buyers &middot; plan", planFmt(t.plan.delivered) + " MWh", "vs " + planFmt(t.fixed.delivered) + " fixed") +
    kpi("Given away &middot; plan", planFmt(t.plan.given_away_mwh) + " MWh", "vs " + planFmt(t.fixed.given_away_mwh) + " fixed") +
    kpi("Held back &middot; NEDA", planFmt(t.plan.neda) + " MWh", "the deliberate slice");
  planBars("chart-plan-flows", ["Fixed split", "WattWise Plan"], [
    { color: "#2E7D6B", values: [t.fixed.delivered, t.plan.delivered] },
    { color: "#7F7F7F", values: [t.fixed.given_away_mwh, t.plan.given_away_mwh] },
    { color: "#B8860B", values: [t.fixed.neda, t.plan.neda] }
  ], "MWh per scheme year");
}

function renderSettle() {
  var b = PLAN.bench;
  var two = b[1];
  document.getElementById("settle-kpis").innerHTML =
    kpi("Schemes replayed", planFmt(two.n), "two-buyer &middot; from 590 real buildings") +
    kpi("Plan wins vs fixed", two.win_vs_fixed_pct + "%", "of schemes give away less") +
    kpi("Plan wins vs persistence", two.win_vs_persistence_pct + "%", "the free baseline") +
    kpi("Income gain vs persistence", "RM" + two.gain_vs_persistence_rm_mwh[0] + "&ndash;" + two.gain_vs_persistence_rm_mwh[1], "per MWh, median");
  planBars("chart-plan-bench", b.map(function (r) { return r.label.replace(" schemes", "").replace(" two-buyer", " 2-b"); }), [
    { color: "#7F7F7F", values: b.map(function (r) { return r.fixed; }) },
    { color: "#0072BD", values: b.map(function (r) { return r.persistence; }) },
    { color: "#2E7D6B", values: b.map(function (r) { return r.plan; }) }
  ], "median % of generation given away");
  var rows = '<tr><th>Bench</th><th>n</th><th>Fixed %</th><th>Persistence %</th><th>Plan %</th><th>Win vs fixed</th><th>Win vs persistence</th></tr>';
  b.forEach(function (r) {
    rows += "<tr><td>" + r.label + "</td><td class=\"num\">" + r.n + "</td><td class=\"num\">" + r.fixed + "</td><td class=\"num\">" + r.persistence + "</td><td class=\"num\">" + r.plan + "</td><td class=\"num\">" + r.win_vs_fixed_pct + "%</td><td class=\"num\">" + r.win_vs_persistence_pct + "%</td></tr>";
  });
  document.getElementById("plan-bench").innerHTML = rows;
}

function renderPlanPages() {
  if (!PLAN) return;
  renderPlanKpis(); renderEstimate(); renderAllocate(); renderSettle();
}

/* plan-mode: hide shift-only chrome on plan pages, keep the shift tab lit on old pages
   the app is wrapped in an iife, so wait for it to export showPage on first use */
var planCurrentPage = "page-plan";
function whenShowPage(fn, tries) {
  if (window.showPage) { fn(); return; }
  if ((tries || 0) > 100) return;
  setTimeout(function () { whenShowPage(fn, (tries || 0) + 1); }, 50);
}

// watch the app's own page switching, whatever calls it (tabs, clicks, commands)
var planMO = new MutationObserver(function () {
  var on = document.querySelector(".page.on");
  if (!on) return;
  if (planCurrentPage === on.id) return;
  planCurrentPage = on.id;
  document.body.classList.toggle("plan-mode", !!PLAN_PAGES[on.id]);
  if (PLAN && PLAN_PAGES[on.id]) renderPlanPages();
});
document.querySelectorAll(".page").forEach(function (p) {
  planMO.observe(p, { attributes: true, attributeFilter: ["class"] });
});

// boot page already carries .on in the html, so no mutation fires: sync once now
(function planSync() {
  var on = document.querySelector(".page.on");
  if (!on) return setTimeout(planSync, 50);
  planCurrentPage = on.id;
  document.body.classList.toggle("plan-mode", !!PLAN_PAGES[on.id]);
  if (PLAN && PLAN_PAGES[on.id]) renderPlanPages();
})();

window.addEventListener("resize", function () { if (PLAN && PLAN_PAGES[planCurrentPage]) renderPlanPages(); });

fetch("data/plan.json").then(function (r) { return r.json(); }).then(function (d) {
  PLAN = d;
  renderPlanPages();
}).catch(function (e) {
  document.getElementById("plan-kpis").innerHTML = kpi("Plan data", "unavailable", "data/plan.json could not be loaded");
  document.getElementById("plan-kpis").setAttribute("data-err", String(e && e.message).slice(0, 120));
});
