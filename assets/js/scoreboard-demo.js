// Live scoreboard for /projects/forecast-scoreboard/: reads site/scoreboard.json from the forecast-scoreboard repository.
(function () {
  "use strict";
  const root = document.getElementById("scoreboard");
  if (!root) return;
  const NS = "http://www.w3.org/2000/svg";
  const q = (selector) => root.querySelector(selector);
  const chartBox = q(".sb-chart"),
    hoverBox = q(".sb-hover"),
    tableBox = q(".sb-table"),
    openBox = q(".sb-open"),
    diffBox = q(".sb-diff"),
    status = q(".sb-status");
  const MODEL = { sv: "Bayesian SV", garch: "GARCH, plug-in" };
  const state = { board: null, series: "ust10y", model: "sv", hover: -1 };
  let geometry = null;

  // ---- formatting ----
  const minus = (s) => s.replace("-", "−");
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = (iso) => {
    const [y, m, d] = iso.slice(0, 10).split("-");
    return Number(d) + " " + MONTHS[Number(m) - 1] + " " + y;
  };
  const stamp = (iso) => day(iso) + ", " + iso.slice(11, 16) + " UTC";
  const pct = (x, digits) => (100 * x).toFixed(digits === undefined ? 1 : digits) + "%";
  const val = (entry, x, signed) => {
    const digits = entry.unit === "bp" ? 1 : 2;
    let s = Math.abs(x) < 0.5 * Math.pow(10, -digits) ? (0).toFixed(digits) : x.toFixed(digits);
    if (signed && x > 0 && s !== (0).toFixed(digits)) s = "+" + s;
    return minus(s) + (entry.unit === "bp" ? " bp" : "%");
  };
  const range = (entry, a, b) => "[" + val(entry, a) + ", " + val(entry, b) + "]";
  // Axis labels carry only the decimals their step needs.
  const tickLabel = (entry, v, step) => {
    const digits = Number.isInteger(step) ? 0 : Number.isInteger(Math.round(step * 1e6) / 1e5) ? 1 : 2;
    const s = Math.abs(v) < 1e-9 ? "0" : minus(v.toFixed(digits));
    return s + (entry.unit === "bp" ? " bp" : "%");
  };

  function el(name, attrs, text) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function html(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ---- data ----
  fetch(root.dataset.src, { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then((board) => {
      state.board = board;
      render();
    })
    .catch(() => {
      status.replaceChildren("The scoreboard couldn't be loaded just now. The record itself is in the ", link(), " repository.");
    });

  function link() {
    const a = html("a", "", "forecast-scoreboard");
    a.href = "https://github.com/GiorgioMB/forecast-scoreboard";
    return a;
  }

  const current = () => state.board.series.find((s) => s.id === state.series);

  function render() {
    const entry = current();
    renderOpen(entry);
    drawChart(entry);
    renderTable(entry);
    renderDiff(entry);
    renderStatus(entry);
  }

  // ---- the next forecast ----
  function renderOpen(entry) {
    const open = entry.open[entry.open.length - 1];
    if (!open) {
      openBox.replaceChildren(html("p", "", "No open forecast at the moment."));
      return;
    }
    const p = html("p");
    p.append(html("strong", "", "Next change, after " + day(open.info_date) + ": "));
    const parts = [];
    for (const m of ["sv", "garch"]) {
      if (!open[m]) continue;
      const qs = open[m].q;
      parts.push(MODEL[m] + " 80% " + range(entry, qs[1], qs[2]) + ", 95% " + range(entry, qs[0], qs[3]));
    }
    p.append(parts.join("; ") + ".");
    openBox.replaceChildren(p);
  }

  // ---- recent outcomes against the chosen model's intervals ----
  function niceStep(span, target) {
    const raw = span / target,
      mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const f of [1, 2, 2.5, 5, 10]) if (f * mag >= raw) return f * mag;
    return 10 * mag;
  }

  function drawChart(entry) {
    const rows = entry.recent.filter((r) => r[state.model]);
    if (!rows.length) {
      chartBox.replaceChildren(html("p", "sb-empty", "Outcomes appear here once the first forecast's value is published."));
      geometry = null;
      hoverBox.textContent = "";
      return;
    }
    const W = Math.max(300, Math.round(chartBox.clientWidth || 640));
    const small = W < 520;
    const H = small ? 230 : 270;
    const m = { l: small ? 46 : 54, r: 8, t: 10, b: 28 };
    const n = rows.length,
      step = (W - m.l - m.r) / n;
    let lim = 0;
    for (const r of rows) lim = Math.max(lim, Math.abs(r.y), Math.abs(r[state.model].q[0]), Math.abs(r[state.model].q[3]));
    lim *= 1.08;
    const x = (i) => m.l + (i + 0.5) * step;
    const y = (v) => m.t + ((lim - v) / (2 * lim)) * (H - m.t - m.b);
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img" });
    svg.setAttribute("aria-label", entry.name + ": the last " + n + " daily changes against the " + MODEL[state.model] + " intervals");

    const tick = niceStep(2 * lim, small ? 4 : 6);
    for (let v = -Math.floor(lim / tick) * tick; v <= lim + 1e-9; v += tick) {
      const yy = y(v).toFixed(1);
      svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: yy, y2: yy, class: Math.abs(v) < 1e-9 ? "sb-zero" : "sb-grid" }));
      svg.appendChild(el("text", { x: m.l - 6, y: Number(yy) + 4, class: "sb-tick", "text-anchor": "end" }, tickLabel(entry, v, tick)));
    }
    // stepped bands: one flat segment per forecast
    for (const [lo, hi, cls] of [
      [0, 3, "sb-band95"],
      [1, 2, "sb-band80"],
    ]) {
      let top = "",
        bottom = "";
      rows.forEach((r, i) => {
        const qs = r[state.model].q,
          a = (x(i) - step / 2).toFixed(1),
          b = (x(i) + step / 2).toFixed(1);
        top += (i ? "L" : "M") + a + " " + y(qs[hi]).toFixed(1) + "L" + b + " " + y(qs[hi]).toFixed(1);
        bottom = "L" + b + " " + y(qs[lo]).toFixed(1) + "L" + a + " " + y(qs[lo]).toFixed(1) + bottom;
      });
      svg.appendChild(el("path", { d: top + bottom + "Z", class: cls }));
    }
    const rDot = Math.max(1.8, Math.min(3.2, step * 0.32));
    rows.forEach((r, i) => {
      const miss = r[state.model].hit95 === false;
      svg.appendChild(
        el("circle", { cx: x(i).toFixed(1), cy: y(r.y).toFixed(1), r: (miss ? rDot * 1.45 : rDot).toFixed(2), class: miss ? "sb-miss" : "sb-dot" })
      );
    });
    svg.appendChild(el("text", { x: m.l, y: H - 8, class: "sb-tick", "text-anchor": "start" }, day(rows[0].target_date)));
    svg.appendChild(el("text", { x: W - m.r, y: H - 8, class: "sb-tick", "text-anchor": "end" }, day(rows[n - 1].target_date)));
    const marker = el("line", { y1: m.t, y2: H - m.b, class: "sb-marker", visibility: "hidden" });
    svg.appendChild(marker);
    chartBox.replaceChildren(svg);
    geometry = { svg, rows, x, step, m, W, marker };

    const pick = (e) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const px = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()).x;
      const i = Math.floor((px - m.l) / step);
      setHover(i >= 0 && i < n ? i : -1);
    };
    svg.addEventListener("pointermove", pick);
    svg.addEventListener("pointerdown", pick);
    svg.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") setHover(-1);
    });
    setHover(-1);
  }

  function setHover(i) {
    if (!geometry) return;
    const entry = current();
    const { rows, x, marker } = geometry;
    if (i < 0) {
      marker.setAttribute("visibility", "hidden");
      const last = rows[rows.length - 1];
      hoverBox.textContent =
        "Latest: " + day(last.target_date) + ", a change of " + val(entry, last.y, true) + ". Hover over or tap the chart for any day.";
      return;
    }
    const r = rows[i],
      qs = r[state.model].q;
    marker.setAttribute("x1", x(i).toFixed(1));
    marker.setAttribute("x2", x(i).toFixed(1));
    marker.setAttribute("visibility", "visible");
    const where = r[state.model].hit80 ? "inside both" : r[state.model].hit95 ? "outside the 80% interval, inside the 95%" : "outside both";
    hoverBox.textContent =
      day(r.target_date) +
      ": a change of " +
      val(entry, r.y, true) +
      "; " +
      MODEL[state.model] +
      " 80% " +
      range(entry, qs[1], qs[2]) +
      ", 95% " +
      range(entry, qs[0], qs[3]) +
      ", " +
      where +
      ".";
  }

  // ---- the scoreboard ----
  function pitBars(hist) {
    const total = hist.reduce((a, b) => a + b, 0);
    const W = 80,
      H = 22,
      w = W / hist.length;
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "sb-pit" });
    const top = Math.max(...hist, 1);
    svg.setAttribute("aria-label", total ? "PIT histogram: " + hist.join(", ") : "no outcomes yet");
    svg.setAttribute("role", "img");
    hist.forEach((c, i) => {
      const h = (c / top) * (H - 2);
      svg.appendChild(el("rect", { x: (i * w + 0.5).toFixed(1), y: (H - h).toFixed(1), width: (w - 1).toFixed(1), height: h.toFixed(1) }));
    });
    if (total)
      svg.appendChild(
        el("line", {
          x1: 0,
          x2: W,
          y1: (H - (total / hist.length / top) * (H - 2)).toFixed(1),
          y2: (H - (total / hist.length / top) * (H - 2)).toFixed(1),
          class: "sb-pit-flat",
        })
      );
    return svg;
  }

  function coverage(stats, level) {
    const c = stats["coverage" + level];
    if (c === null || c === undefined) return "–";
    const ci = stats["coverage" + level + "_ci"];
    return pct(c) + " (" + (100 * ci[0]).toFixed(1) + "–" + pct(ci[1]) + ")";
  }

  function renderTable(entry) {
    const table = html("table", "sb-scores");
    const head = html("tr");
    for (const t of ["Model", "Days scored", "80% coverage", "95% coverage", "Mean width, 80% / 95%", "Mean log score", "PIT"])
      head.appendChild(html("th", "", t));
    table.appendChild(head);
    for (const model of ["sv", "garch"]) {
      const s = entry.models[model];
      const tr = html("tr", model === state.model ? "sb-on" : "");
      tr.appendChild(html("td", "", MODEL[model]));
      tr.appendChild(html("td", "", String(s.n)));
      tr.appendChild(html("td", "", coverage(s, 80)));
      tr.appendChild(html("td", "", coverage(s, 95)));
      tr.appendChild(html("td", "", s.n ? val(entry, s.width80) + " / " + val(entry, s.width95) : "–"));
      tr.appendChild(html("td", "", s.n ? minus(s.log_score.toFixed(3)) : "–"));
      const pit = html("td");
      pit.appendChild(pitBars(s.pit_hist));
      tr.appendChild(pit);
      table.appendChild(tr);
    }
    const wrap = html("div", "sb-table-wrap");
    wrap.appendChild(table);
    tableBox.replaceChildren(wrap);
  }

  function renderDiff(entry) {
    const d = entry.log_score_diff;
    if (!d) {
      diffBox.textContent = "The models' log scores are compared once both have been scored on at least two days.";
      return;
    }
    const verdict =
      Math.abs(d.mean) < 2 * d.se
        ? "no clear difference yet"
        : d.mean > 0
          ? "the Bayesian model is ahead so far"
          : "the plug-in model is ahead so far";
    diffBox.textContent =
      "Mean log score, Bayesian SV minus GARCH: " +
      minus((d.mean >= 0 ? "+" : "") + d.mean.toFixed(3)) +
      " ± " +
      d.se.toFixed(3) +
      " (Newey–West standard error, " +
      d.n +
      " days): " +
      verdict +
      ".";
  }

  function renderStatus(entry) {
    const b = state.board;
    if (!b.started) {
      status.replaceChildren(
        "Nothing has been forecast yet: the record starts with the first scheduled run. Everything will be in the ",
        link(),
        " repository."
      );
      return;
    }
    const skips = b.skips.filter((s) => s.series === entry.id).length;
    const parts = ["Forecasting since " + day(b.started) + "; last forecast issued " + stamp(b.last_issued)];
    if (b.last_scored) parts.push("last outcome scored " + stamp(b.last_scored));
    parts.push(skips === 1 ? "1 day skipped" : skips + " days skipped");
    status.replaceChildren(parts.join("; ") + ". The full record is in the ", link(), " repository.");
  }

  // ---- controls ----
  root.querySelectorAll('input[name="sb-series"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.series = input.value;
      if (state.board) render();
    })
  );
  root.querySelectorAll('input[name="sb-model"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.model = input.value;
      if (state.board) {
        drawChart(current());
        renderTable(current());
      }
    })
  );
  let lastWidth = 0;
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      const w = Math.round(chartBox.clientWidth);
      if (!state.board || w === lastWidth) return;
      lastWidth = w;
      drawChart(current());
    }).observe(chartBox);
  }
})();
