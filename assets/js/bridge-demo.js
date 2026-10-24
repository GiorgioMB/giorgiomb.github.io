// Interactive figure for /projects/bridge-sampling/: reported MCSE vs actual error as dimension grows.
(function () {
  "use strict";
  const root = document.getElementById("bridge-demo");
  if (!root) return;

  // Precomputed with bridge-core.js: 20 repetitions per point (see the page for the setup).
  const DEFAULTS = {
    "sample-500": [
      { d: 5, rmse: 0.01209, mcse: 0.01187, fails: 0 },
      { d: 10, rmse: 0.0199, mcse: 0.02239, fails: 0 },
      { d: 25, rmse: 0.05862, mcse: 0.05523, fails: 0 },
      { d: 50, rmse: 0.1247, mcse: 0.1325, fails: 0 },
      { d: 75, rmse: 0.3233, mcse: 0.2852, fails: 0 },
      { d: 100, rmse: 0.713, mcse: 0.6995, fails: 0 },
      { d: 125, rmse: 2.043, mcse: 0.93, fails: 0 },
      { d: 150, rmse: 15.07, mcse: 0.9309, fails: 0 },
      { d: 175, rmse: 45.14, mcse: 0.9805, fails: 0 },
      { d: 200, rmse: 133.4, mcse: 0.9706, fails: 0 },
    ],
    "hybrid-500": [
      { d: 5, rmse: 0.005966, mcse: 0.006183, fails: 0 },
      { d: 10, rmse: 0.007869, mcse: 0.008388, fails: 0 },
      { d: 25, rmse: 0.01805, mcse: 0.01336, fails: 0 },
      { d: 50, rmse: 0.0179, mcse: 0.01951, fails: 0 },
      { d: 75, rmse: 0.02889, mcse: 0.02542, fails: 0 },
      { d: 100, rmse: 0.02855, mcse: 0.02876, fails: 0 },
      { d: 125, rmse: 0.03857, mcse: 0.03238, fails: 0 },
      { d: 150, rmse: 0.03391, mcse: 0.03559, fails: 0 },
      { d: 175, rmse: 0.03855, mcse: 0.0369, fails: 0 },
      { d: 200, rmse: 0.04908, mcse: 0.04109, fails: 0 },
    ],
    "sample-1000": [
      { d: 5, rmse: 0.007639, mcse: 0.006053, fails: 0 },
      { d: 10, rmse: 0.00853, mcse: 0.01121, fails: 0 },
      { d: 25, rmse: 0.03283, mcse: 0.02693, fails: 0 },
      { d: 50, rmse: 0.03699, mcse: 0.05644, fails: 0 },
      { d: 75, rmse: 0.1064, mcse: 0.09747, fails: 0 },
      { d: 100, rmse: 0.2071, mcse: 0.1644, fails: 0 },
      { d: 125, rmse: 0.2248, mcse: 0.2933, fails: 0 },
      { d: 150, rmse: 0.7301, mcse: 0.5154, fails: 0 },
      { d: 175, rmse: 1.614, mcse: 0.8037, fails: 0 },
      { d: 200, rmse: 2.554, mcse: 0.8621, fails: 0 },
    ],
    "hybrid-1000": [
      { d: 5, rmse: 0.002623, mcse: 0.002989, fails: 0 },
      { d: 10, rmse: 0.004879, mcse: 0.004083, fails: 0 },
      { d: 25, rmse: 0.007964, mcse: 0.007031, fails: 0 },
      { d: 50, rmse: 0.01079, mcse: 0.009682, fails: 0 },
      { d: 75, rmse: 0.01465, mcse: 0.01245, fails: 0 },
      { d: 100, rmse: 0.01457, mcse: 0.01458, fails: 0 },
      { d: 125, rmse: 0.01481, mcse: 0.01603, fails: 0 },
      { d: 150, rmse: 0.02181, mcse: 0.01745, fails: 0 },
      { d: 175, rmse: 0.01334, mcse: 0.01915, fails: 0 },
      { d: 200, rmse: 0.0174, mcse: 0.01978, fails: 0 },
    ],
    "sample-2000": [
      { d: 5, rmse: 0.002652, mcse: 0.003086, fails: 0 },
      { d: 10, rmse: 0.004236, mcse: 0.005534, fails: 0 },
      { d: 25, rmse: 0.01289, mcse: 0.01329, fails: 0 },
      { d: 50, rmse: 0.02949, mcse: 0.0265, fails: 0 },
      { d: 75, rmse: 0.02695, mcse: 0.04204, fails: 0 },
      { d: 100, rmse: 0.05167, mcse: 0.06132, fails: 0 },
      { d: 125, rmse: 0.07918, mcse: 0.08767, fails: 0 },
      { d: 150, rmse: 0.1471, mcse: 0.1266, fails: 0 },
      { d: 175, rmse: 0.1623, mcse: 0.1874, fails: 0 },
      { d: 200, rmse: 0.2347, mcse: 0.2796, fails: 0 },
    ],
    "hybrid-2000": [
      { d: 5, rmse: 0.00192, mcse: 0.001527, fails: 0 },
      { d: 10, rmse: 0.002703, mcse: 0.002239, fails: 0 },
      { d: 25, rmse: 0.003716, mcse: 0.003627, fails: 0 },
      { d: 50, rmse: 0.003682, mcse: 0.004982, fails: 0 },
      { d: 75, rmse: 0.006791, mcse: 0.006044, fails: 0 },
      { d: 100, rmse: 0.007879, mcse: 0.007102, fails: 0 },
      { d: 125, rmse: 0.007716, mcse: 0.007954, fails: 0 },
      { d: 150, rmse: 0.009657, mcse: 0.008382, fails: 0 },
      { d: 175, rmse: 0.01193, mcse: 0.00959, fails: 0 },
      { d: 200, rmse: 0.007885, mcse: 0.01001, fails: 0 },
    ],
  };
  const CAP = Math.sqrt(Math.log(3)); // the MCSE can never exceed this
  const TRUST = 0.3; // trust threshold from Bridge Sampling Diagnostics
  const GRID = [5, 10, 25, 50, 75, 100, 125, 150, 175, 200];
  const LIVE_REPS = 10;
  const NS = "http://www.w3.org/2000/svg";

  const state = { S: 500, proposal: "sample", rows: DEFAULTS["sample-500"], live: false, worker: null };
  const chart = root.querySelector(".bd-chart");
  const readout = root.querySelector(".bd-readout");
  const status = root.querySelector(".bd-status");
  const runButton = root.querySelector(".bd-run");

  const fmt = (x) => (x >= 10 ? x.toFixed(0) : x >= 1 ? x.toFixed(1) : x >= 0.1 ? x.toFixed(2) : x.toPrecision(2));
  const proposalName = () => (state.proposal === "sample" ? "standard proposal" : "hybrid proposal");
  const drawsName = () => state.S.toLocaleString("en-US");

  function showDefaults() {
    stopWorker();
    state.rows = DEFAULTS[state.proposal + "-" + state.S];
    state.live = false;
    status.textContent = "Showing precomputed results: 20 runs at each dimension.";
    render();
  }

  root.querySelectorAll('input[name="bd-draws"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.S = Number(input.value);
      showDefaults();
    })
  );
  root.querySelectorAll('input[name="bd-proposal"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.proposal = input.value;
      showDefaults();
    })
  );
  runButton.addEventListener("click", runLive);

  function stopWorker() {
    if (state.worker) {
      state.worker.terminate();
      state.worker = null;
    }
    runButton.disabled = false;
  }

  function runLive() {
    if (typeof Worker === "undefined") {
      status.textContent = "This browser can't run the simulation, so the precomputed results are shown.";
      return;
    }
    stopWorker();
    const worker = new Worker(root.dataset.worker);
    state.worker = worker;
    state.rows = [];
    state.live = true;
    runButton.disabled = true;
    status.textContent = "Running " + LIVE_REPS + " repetitions at each dimension…";
    render();
    worker.onmessage = (event) => {
      state.rows = event.data.rows;
      if (event.data.type === "progress") {
        const done = state.rows[state.rows.length - 1].d;
        status.textContent = "Running " + LIVE_REPS + " repetitions at each dimension: up to " + done + " of 200 done.";
      } else {
        status.textContent = "Showing your run: " + LIVE_REPS + " fresh repetitions at each dimension.";
        stopWorker();
      }
      render();
    };
    worker.onerror = () => {
      status.textContent = "The simulation stopped unexpectedly, so the precomputed results are shown.";
      showDefaults();
    };
    worker.postMessage({ S: state.S, proposal: state.proposal, grid: GRID, reps: LIVE_REPS, seed: Math.floor(Math.random() * 1e9) });
  }

  function el(name, attrs, text) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function render() {
    drawChart();
    writeReadout();
  }

  function drawChart() {
    const W = Math.max(300, Math.min(760, Math.round(chart.clientWidth || 640)));
    const H = Math.round(W * (W < 520 ? 0.82 : 0.56));
    const m = { l: W < 520 ? 46 : 58, r: W < 520 ? 12 : 112, t: 14, b: 44 };
    const yMin = -3,
      yMax = Math.log10(300);
    const x = (d) => m.l + (d / 200) * (W - m.l - m.r);
    const y = (v) => m.t + ((yMax - Math.log10(Math.max(v, 1e-3))) / (yMax - yMin)) * (H - m.t - m.b);
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", class: "bd-svg" });
    const title = el("title", {}, "Reported MCSE and actual error against posterior dimension");
    svg.appendChild(title);

    // region the MCSE can never reach
    svg.appendChild(el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: y(CAP) - m.t, class: "bd-unreachable" }));
    svg.appendChild(el("text", { x: m.l + 8, y: m.t + 16, class: "bd-note" }, "No MCSE can report an error this large"));

    // gridlines and y labels (decades)
    for (let p = -3; p <= 2; p++) {
      const v = Math.pow(10, p),
        yy = y(v);
      svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: yy, y2: yy, class: "bd-grid" }));
      svg.appendChild(el("text", { x: m.l - 6, y: yy + 4, class: "bd-tick", "text-anchor": "end" }, v >= 1 ? String(v) : v.toString()));
    }
    // x ticks
    for (const d of [0, 50, 100, 150, 200]) {
      svg.appendChild(el("text", { x: x(d), y: H - m.b + 16, class: "bd-tick", "text-anchor": "middle" }, String(d)));
    }
    svg.appendChild(el("text", { x: (m.l + W - m.r) / 2, y: H - 6, class: "bd-axis", "text-anchor": "middle" }, "Dimension of the posterior"));
    const yl = el(
      "text",
      { x: 0, y: 0, class: "bd-axis", "text-anchor": "middle", transform: "translate(12," + (m.t + (H - m.t - m.b) / 2) + ") rotate(-90)" },
      "Error in log marginal likelihood"
    );
    svg.appendChild(yl);

    // reference lines
    svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: y(CAP), y2: y(CAP), class: "bd-cap" }));
    svg.appendChild(el("text", { x: m.l + 8, y: y(CAP) - 6, class: "bd-cap-label", "text-anchor": "start" }, "MCSE ceiling ≈ 1.05"));
    svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: y(TRUST), y2: y(TRUST), class: "bd-trust" }));
    svg.appendChild(el("text", { x: W - m.r - 4, y: y(TRUST) + 14, class: "bd-trust-label", "text-anchor": "end" }, "trust threshold 0.3"));

    // series
    const rows = state.rows.filter((r) => Number.isFinite(r.mcse) && Number.isFinite(r.rmse));
    const series = [
      { key: "rmse", cls: "bd-actual", label: "actual error" },
      { key: "mcse", cls: "bd-reported", label: "reported MCSE" },
    ];
    const ends = [];
    for (const s of series) {
      if (!rows.length) continue;
      const pts = rows.map((r) => x(r.d).toFixed(1) + "," + y(r[s.key]).toFixed(1)).join(" ");
      svg.appendChild(el("polyline", { points: pts, class: "bd-line " + s.cls }));
      for (const r of rows) svg.appendChild(el("circle", { cx: x(r.d), cy: y(r[s.key]), r: 3.2, class: "bd-dot " + s.cls }));
      const last = rows[rows.length - 1];
      ends.push({ s, x: x(last.d), y: y(last[s.key]) });
    }
    // direct labels at the line ends, nudged apart if they collide
    if (ends.length === 2 && Math.abs(ends[0].y - ends[1].y) < 16) {
      const mid = (ends[0].y + ends[1].y) / 2,
        up = ends[0].y <= ends[1].y ? 0 : 1;
      ends[up].y = mid - 9;
      ends[1 - up].y = mid + 9;
    }
    for (const e of ends) {
      const attrs =
        W >= 520
          ? { x: e.x + 8, y: e.y + 4, class: "bd-series-label " + e.s.cls, "text-anchor": "start" }
          : { x: e.x - 8, y: e.y - 8, class: "bd-series-label " + e.s.cls, "text-anchor": "end" };
      svg.appendChild(el("text", attrs, e.s.label));
    }

    chart.replaceChildren(svg);
    const last = rows[rows.length - 1];
    svg.setAttribute(
      "aria-label",
      last
        ? "At " + last.d + " dimensions the reported MCSE is " + fmt(last.mcse) + " and the actual error is " + fmt(last.rmse) + "."
        : "No results yet."
    );
  }

  function writeReadout() {
    const rows = state.rows.filter((r) => Number.isFinite(r.mcse) && Number.isFinite(r.rmse));
    if (!rows.length) {
      readout.textContent = "";
      return;
    }
    const last = rows[rows.length - 1];
    const lead = "With the " + proposalName() + " and " + drawsName() + " draws";
    const broken = rows.find((r) => r.rmse > 2 * r.mcse && r.rmse > 0.1);
    const warned = rows.find((r) => r.mcse >= TRUST);
    if (broken) {
      let text =
        lead +
        ", at " +
        last.d +
        " dimensions the MCSE reports " +
        fmt(last.mcse) +
        ", but the estimates are off by " +
        fmt(last.rmse) +
        " on average. The error bar has hit its ceiling, so it can't tell you how wrong it is.";
      if (warned && warned.d <= broken.d) text += " It did cross the 0.3 threshold at " + warned.d + " dimensions: that was the warning to act on.";
      readout.textContent = text;
    } else {
      const worst = Math.max(...rows.map((r) => Math.max(r.rmse / r.mcse, r.mcse / r.rmse)));
      readout.textContent =
        lead +
        ", the reported error stays within a factor of " +
        worst.toFixed(1) +
        " of the actual error up to " +
        last.d +
        " dimensions" +
        (warned ? ", though it passes the 0.3 threshold at " + warned.d + "." : ", and below the 0.3 trust threshold.");
    }
  }

  let resizeFrame = 0;
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(drawChart);
    }).observe(chart);
  }
  showDefaults();
})();
