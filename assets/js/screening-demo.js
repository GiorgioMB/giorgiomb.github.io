// Interactive figure for /projects/screening-map/: certify-then-solve on one graph, one stage at a time, for the query {κ_OR < τ}.
(function () {
  "use strict";
  const root = document.getElementById("screening-map");
  if (!root || typeof ScreeningCore === "undefined") return;
  const C = ScreeningCore;
  const NS = "http://www.w3.org/2000/svg";
  const SEEDS = 4; // precomputed seeds per expected degree; seed 0 at degree 8 is the graph of the paper's figure
  const N_RGG = 800;
  const NAMES = ["(a) BF interval", "(b) 2-hop interval", "(c) + TLW certificate", "(d) exact solver"];

  const q = (selector) => root.querySelector(selector);
  const mapBox = q(".sm-map"),
    chartBox = q(".sm-chart"),
    readout = q(".sm-readout"),
    live = q(".sm-live"),
    status = q(".sm-status"),
    tauInput = q(".sm-tau-input"),
    tauValue = q(".sm-tau-value");
  const rggOnly = root.querySelectorAll(".sm-rgg-only");
  const stepInputs = Array.from(root.querySelectorAll('input[name="sm-stage"]'));
  const stepNums = Array.from(root.querySelectorAll(".sm-step-num"));

  const state = { family: "rgg", degree: 8, seed: 0, stage: 0, k: 0, g: null, rows: null, st: null, counts: null, hover: -1, pinned: false, automap: false };
  const cache = new Map();
  let token = 0,
    map = null,
    chart = null,
    pointerType = "mouse",
    frame = 0;

  // ---- formatting ----
  const minus = (s) => s.replace("-", "−");
  const fmtTau = (k) => minus((k / 100).toFixed(2));
  const fmtVal = (x) => (Math.abs(x) < 1e-12 ? "0" : minus(x.toFixed(3))); // float noise around zero prints as 0
  const int = (x) => x.toLocaleString("en-US");
  const pct = (x) => (100 * x).toFixed(1) + "%";
  const plain = (text) => text.replace(/κ_(OR|BF)/g, "κ $1");

  // Text with κ_OR and κ_BF set as κ with a subscript.
  function rich(text) {
    const frag = document.createDocumentFragment();
    for (const part of text.split(/(κ_OR|κ_BF)/)) {
      if (part === "κ_OR" || part === "κ_BF") {
        const sub = document.createElement("sub");
        sub.textContent = part.slice(2);
        frag.append("κ", sub);
      } else if (part) frag.append(part);
    }
    return frag;
  }

  function el(name, attrs, text) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ---- data ----
  const keyOf = () => (state.family === "rgg" ? "rgg-d" + state.degree + "-s" + state.seed : state.family);

  function load() {
    const key = keyOf(),
      mine = ++token;
    if (!cache.has(key)) {
      cache.set(
        key,
        fetch(root.dataset.src + key + ".json")
          .then((response) => {
            if (!response.ok) throw new Error("HTTP " + response.status);
            return response.json();
          })
          .then((raw) => {
            const g = C.decode(raw);
            return { g, rows: C.sweep(g) };
          })
      );
    }
    status.textContent = "Loading the graph…";
    cache.get(key).then(
      (d) => {
        if (mine !== token) return;
        state.g = d.g;
        state.rows = d.rows;
        state.st = new Int8Array(d.g.m);
        state.hover = -1;
        state.pinned = false;
        buildMap();
        buildChart();
        update();
        status.textContent = describe();
        writeAbout();
        writeSpike();
      },
      () => {
        cache.delete(key);
        if (mine === token) status.textContent = "This graph couldn't be loaded. Check your connection and choose it again.";
      }
    );
  }

  function describe() {
    const g = state.g,
      size = int(g.n) + " vertices and " + int(g.m) + " edges";
    if (state.family === "rgg") {
      const r = Math.sqrt(state.degree / (N_RGG * Math.PI)).toFixed(6);
      const paper = state.degree === 8 && state.seed === 0 ? ", the graph of the paper's figure" : "";
      return (
        "Random geometric graph: " +
        N_RGG +
        " uniform points in the unit square, joined when closer than " +
        r +
        " (expected degree " +
        state.degree +
        "), seed " +
        state.seed +
        paper +
        ". Its largest component, shown here, has " +
        size +
        "."
      );
    }
    if (state.family === "yeast")
      return "Yeast, one of the paper's real networks: its largest component has " + size + ", drawn as on the workshop poster.";
    return "Zachary's karate club: " + size + ".";
  }

  // The "How it's computed" paragraph below the demo, for the graph on screen.
  function aboutText() {
    if (state.family === "rgg") {
      const d = state.degree,
        s = state.seed,
        r = Math.sqrt(d / (N_RGG * Math.PI)).toFixed(4);
      let which = "It is seed " + s + " of " + (["one", "two", "three", "four", "five", "six"][SEEDS - 1] || SEEDS) + " at this degree";
      if (d === 8 && s === 0) which += ", the graph of the paper's figure, and \u201cDraw another graph\u201d steps through the other three.";
      else
        which +=
          "; \u201cDraw another graph\u201d moves to seed " +
          ((s + 1) % SEEDS) +
          (s + 1 === SEEDS ? ", back at the start" : "") +
          ". The graph of the paper's figure is seed 0 at degree 8.";
      return (
        "This random geometric graph has " +
        N_RGG +
        " uniform points in the unit square, joined when closer than $r = " +
        r +
        "$, so that the expected degree $" +
        N_RGG +
        " \\pi r^2$ is " +
        d +
        "; it is restricted to its largest component and drawn at its points. " +
        which
      );
    }
    if (state.family === "yeast")
      return "Yeast is one of the paper's real networks. It is restricted to its largest component and drawn with a Kamada\u2013Kawai layout.";
    return "Zachary's karate club is one of the paper's real networks, drawn with a Kamada\u2013Kawai layout.";
  }

  // ---- the text below the demo, for the graph and threshold on screen ----
  const texNum = (k) => String(Number((k / 100).toFixed(2))); // 0, -0.5, 0.25
  const LT = (t) => "$\\kappa_{\\mathrm{OR}} < " + t + "$",
    GE = (t) => "$\\kappa_{\\mathrm{OR}} \\geq " + t + "$";
  const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

  function graphName() {
    if (state.family === "rgg") return state.degree === 8 && state.seed === 0 ? "the paper's graph" : "this graph";
    return state.family === "yeast" ? "Yeast" : "the karate club";
  }

  // MathJax calls are chained, as its documentation asks; if MathJax hasn't started yet, its first pass typesets the page.
  let typesetting = Promise.resolve();
  function setMath(node, text) {
    node.textContent = text;
    const MJ = window.MathJax;
    if (!(MJ && MJ.startup && MJ.startup.promise && MJ.typesetPromise)) return;
    typesetting = typesetting
      .then(() => MJ.startup.promise)
      .then(() => {
        if (MJ.typesetClear) MJ.typesetClear([node]);
        return MJ.typesetPromise([node]);
      })
      .catch(() => {});
  }

  function writeAbout() {
    const about = document.getElementById("screening-map-about");
    if (about) setMath(about, aboutText());
  }

  // How the edges one group of stages decides split by sign, led by the sign most of them have.
  function signPart(subject, none, below, total, t) {
    if (total === 0) return none;
    const f = below / total;
    if (below === total) return "everything " + subject + " has " + LT(t);
    if (below === 0) return "everything " + subject + " has " + GE(t);
    if (f >= 0.9) return "almost everything " + subject + " has " + LT(t);
    if (f <= 0.1) return "almost everything " + subject + " has " + GE(t);
    return "of what " + subject + ", " + (f >= 0.5 ? pct(f) + " has " + LT(t) : pct(1 - f) + " has " + GE(t));
  }

  function seeingText() {
    const g = state.g,
      c = state.counts,
      t = texNum(state.k),
      h = c.here;
    const share = (n) => pct(n / g.m);
    const solver = h[C.STAGES - 1];
    let text = "On " + graphName() + " at $\\tau = " + t + "$" + (state.k === 0 ? ", the sign query, " : ", ");
    const bf = signPart("the BF interval decides", "the BF interval decides no edge", c.below[0], h[0], t);
    if (h[0] === g.m) return text + "the BF interval alone decides every edge, so no edge needs a transport problem. " + cap(bf) + ".";
    text += "the BF interval alone decides " + share(h[0]) + " of the edges, ";
    text += h[1] > 0 ? "the 2-hop interval brings that to " + share(h[0] + h[1]) : "the 2-hop interval adds none";
    if (h[2] > 0) text += (h[1] > 0 ? " and the TLW certificate to " : " and the TLW certificate brings that to ") + share(h[0] + h[1] + h[2]);
    else text += " and the TLW certificate adds none";
    text +=
      solver === 0
        ? ", so no edge needs a transport problem. "
        : ", so " + int(solver) + " of the " + int(g.m) + " edges " + (solver === 1 ? "needs" : "need") + " a transport problem. ";
    const added = signPart(
      "the 2-hop interval and the TLW certificate add",
      "the 2-hop interval and the TLW certificate add none",
      c.below[1] + c.below[2],
      h[1] + h[2],
      t
    );
    return text + cap(bf) + ", and " + added + ".";
  }

  // Debounced, so that dragging the threshold doesn't typeset on every step.
  let seeingTimer = 0;
  function scheduleSeeing() {
    clearTimeout(seeingTimer);
    seeingTimer = setTimeout(() => {
      const seeing = document.getElementById("screening-map-seeing");
      if (seeing && state.g) setMath(seeing, seeingText());
    }, 150);
  }

  // The spike at tau = 0 is a property of the graph, so this one follows the graph only.
  function writeSpike() {
    const spike = document.getElementById("screening-map-spike");
    if (!spike) return;
    const g = state.g,
      st = C.stages(g, 0),
      last = C.STAGES - 1;
    let solver = 0,
      held = 0;
    for (let i = 0; i < g.m; i++) {
      if (st[i] !== last) continue;
      solver++;
      if (C.heldByTolerance(g, last - 1, i, 0)) held++;
    }
    setMath(
      spike,
      held === 0
        ? "On " + graphName() + ", no transport problem at $\\tau = 0$ comes from a lower end of exactly 0."
        : "That is the spike in the chart at $\\tau = 0$: on " +
            graphName() +
            ", " +
            int(held) +
            " of the " +
            int(solver) +
            " transport problems at $\\tau = 0$ " +
            (held === 1 ? "is an edge whose lower end is" : "are edges whose lower end is") +
            " exactly 0."
    );
  }

  // ---- the cascade at the current threshold ----
  function update() {
    const g = state.g;
    if (!g) return;
    const tau = C.tauOf(state.k);
    C.stages(g, tau, state.st);
    state.counts = C.counts(g, state.st, tau);
    if (state.hover >= 0 && state.st[state.hover] > shownStage()) {
      state.hover = -1;
      state.pinned = false;
    }
    tauValue.textContent = fmtTau(state.k);
    let decided = 0;
    for (let s = 0; s < C.STAGES - 1; s++) {
      decided += state.counts.here[s];
      stepNums[s].textContent = pct(decided / g.m) + " decided";
    }
    stepNums[C.STAGES - 1].textContent = int(state.counts.here[C.STAGES - 1]) + " transport problems";
    redraw();
    moveMarker();
    scheduleSeeing();
  }

  function redraw() {
    drawLayers();
    drawHover();
    writeReadout();
    const summary = plain(stageSentence());
    map.svg.setAttribute("aria-label", (state.automap ? "Automap: every edge, colored by the stage that decides it. " : NAMES[state.stage] + ". ") + summary);
    live.textContent = summary;
  }

  function setK(k) {
    k = Math.max(-C.KMAX, Math.min(C.KMAX, k));
    if (k === state.k) return;
    state.k = k;
    tauInput.value = String(k);
    update();
  }

  function stageSentence() {
    const g = state.g,
      c = state.counts,
      S = state.stage;
    const here = c.here[S],
      below = c.below[S];
    const split = int(below) + " with κ_OR < τ and " + int(here - below) + " with κ_OR ≥ τ";
    let decided = 0;
    for (let s = 0; s <= Math.min(S, C.STAGES - 2); s++) decided += c.here[s];
    if (S === 0)
      return (
        "At τ = " +
        fmtTau(state.k) +
        ", the BF interval decides " +
        int(here) +
        " of the " +
        int(g.m) +
        " edges (" +
        pct(here / g.m) +
        "): " +
        split +
        "."
      );
    if (S < C.STAGES - 1)
      return (
        (S === 1 ? "The 2-hop interval" : "The TLW certificate") +
        " decides " +
        int(here) +
        " more: " +
        split +
        ". " +
        pct(decided / g.m) +
        " of the edges are now decided without a transport problem."
      );
    return "The exact solver takes the remaining " + int(here) + " edges (" + pct(here / g.m) + "), one transport problem each: " + split + ".";
  }

  // ---- map ----
  function buildMap() {
    const g = state.g;
    let W = 0,
      H = 0;
    for (let j = 0; j < g.n; j++) {
      W = Math.max(W, g.x[j]);
      H = Math.max(H, g.y[j]);
    }
    W *= 1000;
    H *= 1000;
    const seg = new Float64Array(4 * g.m),
      d = new Array(g.m);
    for (let i = 0; i < g.m; i++) {
      const a = g.u[i],
        b = g.v[i];
      const x1 = g.x[a] * 1000,
        y1 = H - g.y[a] * 1000,
        x2 = g.x[b] * 1000,
        y2 = H - g.y[b] * 1000;
      seg.set([x1, y1, x2, y2], 4 * i);
      d[i] = "M" + x1.toFixed(1) + " " + y1.toFixed(1) + "L" + x2.toFixed(1) + " " + y2.toFixed(1);
    }
    const pad = 14;
    const svg = el("svg", {
      viewBox: [-pad, -pad, W + 2 * pad, H + 2 * pad].map((v) => Number(v.toFixed(1))).join(" "),
      class: "sm-svg" + (g.m < 400 ? " sm-sparse" : ""),
      role: "img",
    });
    const old = el("path", { class: "sm-old" }),
      colored = el("g", {}),
      neg = el("path", { class: "sm-neg" }),
      pos = el("path", { class: "sm-pos" }),
      hi = el("path", { class: "sm-hi" }),
      ends = el("path", { class: "sm-ends" });
    const auto = [];
    for (let s = 0; s < C.STAGES; s++) auto.push(el("path", { class: "sm-auto sm-auto-" + s }));
    const autoLayer = el("g", { class: "sm-auto-layer" });
    autoLayer.append(...auto);
    colored.append(neg, pos);
    svg.append(old, colored, autoLayer, hi, ends);
    mapBox.replaceChildren(svg, automapTag);
    map = { svg, seg, d, old, colored, neg, pos, hi, ends, auto };

    svg.addEventListener("pointerdown", (e) => {
      pointerType = e.pointerType || "mouse";
    });
    svg.addEventListener("pointermove", (e) => {
      if (state.pinned || (e.pointerType && e.pointerType !== "mouse")) return;
      const cx = e.clientX,
        cy = e.clientY;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!state.pinned) setHover(nearest(cx, cy, 8), false);
      });
    });
    svg.addEventListener("pointerleave", (e) => {
      if (state.pinned || (e.pointerType && e.pointerType !== "mouse")) return;
      cancelAnimationFrame(frame);
      setHover(-1, false);
    });
    svg.addEventListener("click", (e) => {
      cancelAnimationFrame(frame);
      const i = nearest(e.clientX, e.clientY, pointerType === "mouse" ? 8 : 20);
      if (i < 0 || (state.pinned && i === state.hover)) setHover(-1, false);
      else setHover(i, true);
    });
  }

  function drawLayers() {
    const g = state.g,
      st = state.st,
      S = state.stage,
      tau = C.tauOf(state.k);
    if (state.automap) {
      // iddt: the whole map at once, every edge colored by the stage that decides it
      const layers = map.auto.map(() => []);
      for (let i = 0; i < g.m; i++) layers[st[i]].push(map.d[i]);
      map.auto.forEach((path, s) => path.setAttribute("d", layers[s].join("")));
      ["old", "neg", "pos"].forEach((k) => map[k].setAttribute("d", ""));
      return;
    }
    map.auto.forEach((path) => path.setAttribute("d", ""));
    const old = [],
      neg = [],
      pos = [];
    for (let i = 0; i < g.m; i++) {
      if (st[i] < S) old.push(map.d[i]);
      else if (st[i] === S) (g.kappa[i] < tau ? neg : pos).push(map.d[i]);
    }
    map.old.setAttribute("d", old.join(""));
    map.neg.setAttribute("d", neg.join(""));
    map.pos.setAttribute("d", pos.join(""));
    // the less frequent sign on top, so that it stays visible, as in the paper's figure
    if (neg.length < pos.length) map.colored.append(map.pos, map.neg);
    else map.colored.append(map.neg, map.pos);
  }

  // Nearest edge drawn at the current stage, within px screen pixels of the pointer.
  function nearest(cx, cy, px) {
    const g = state.g,
      st = state.st,
      S = shownStage(),
      s = map.seg;
    const ctm = map.svg.getScreenCTM();
    if (!g || !ctm) return -1;
    const p = new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
    const r = px / Math.hypot(ctm.a, ctm.b);
    let best = -1,
      bestD = r * r;
    for (let i = 0; i < g.m; i++) {
      if (st[i] > S) continue;
      const x1 = s[4 * i],
        y1 = s[4 * i + 1],
        dx = s[4 * i + 2] - x1,
        dy = s[4 * i + 3] - y1;
      const L = dx * dx + dy * dy;
      let t = L > 0 ? ((p.x - x1) * dx + (p.y - y1) * dy) / L : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = x1 + t * dx - p.x,
        ey = y1 + t * dy - p.y,
        D = ex * ex + ey * ey;
      if (D < bestD) {
        bestD = D;
        best = i;
      }
    }
    return best;
  }

  function setHover(i, pinned) {
    if (i === state.hover && state.pinned === (i >= 0 && pinned)) return;
    state.hover = i;
    state.pinned = i >= 0 && pinned;
    drawHover();
    writeReadout();
  }

  function drawHover() {
    const i = state.hover;
    if (i < 0) {
      map.hi.setAttribute("d", "");
      map.ends.setAttribute("d", "");
      return;
    }
    const s = map.seg;
    map.hi.setAttribute("d", map.d[i]);
    map.ends.setAttribute(
      "d",
      "M" + s[4 * i].toFixed(1) + " " + s[4 * i + 1].toFixed(1) + "h0M" + s[4 * i + 2].toFixed(1) + " " + s[4 * i + 3].toFixed(1) + "h0"
    );
  }

  // ---- readout ----
  function para(text, cls) {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    p.append(rich(text));
    return p;
  }

  function writeReadout() {
    if (!state.g) return;
    if (state.hover >= 0) readout.replaceChildren(...edgeCard(state.hover));
    else readout.replaceChildren(para(stageSentence()), para("Hover over an edge, or tap it, to see its intervals.", "sm-hint"));
  }

  function edgeCard(i) {
    const g = state.g,
      tau = C.tauOf(state.k),
      D = state.st[i];
    const table = document.createElement("table");
    table.className = "sm-table";
    const row = (cells, cls, tag) => {
      const tr = document.createElement("tr");
      if (cls) tr.className = cls;
      for (const text of cells) {
        const cell = document.createElement(tag || "td");
        cell.append(rich(text));
        tr.appendChild(cell);
      }
      table.appendChild(tr);
    };
    row(["Stage", "Interval for κ_OR", "At τ = " + fmtTau(state.k)], "", "th");
    let held = false;
    for (let s = 0; s < C.STAGES - 1; s++) {
      const lo = g.lo[s][i],
        up = g.up[s][i];
      let verdict;
      if (s < D) {
        verdict = "doesn't decide";
        if (C.heldByTolerance(g, s, i, tau)) {
          verdict += " *";
          held = true;
        }
      } else if (s === D) verdict = up + C.TOL < tau ? "decides κ_OR < τ" : "decides κ_OR ≥ τ";
      else verdict = "not needed";
      row([NAMES[s], "[" + fmtVal(lo) + ", " + fmtVal(up) + "]", verdict], s === D ? "sm-row-on" : s > D ? "sm-row-off" : "");
    }
    const kappa = g.kappa[i];
    let relation = kappa < tau ? "κ_OR < τ" : "κ_OR ≥ τ";
    if (kappa !== tau && Math.abs(kappa - tau) <= 1e-12) relation += ", equal to τ up to rounding";
    const last = C.STAGES - 1;
    row([NAMES[last], "κ_OR = " + fmtVal(kappa), D === last ? "solves it: " + relation : "not needed"], D === last ? "sm-row-on" : "sm-row-off");

    const out = [
      para("Edge between vertices of degree " + g.deg[g.u[i]] + " and " + g.deg[g.v[i]] + ", with κ_BF = " + fmtVal(g.bf[i]) + "."),
      table,
    ];
    if (held)
      out.push(
        para(
          "* Its lower end equals τ, but every interval is widened by 10⁻⁹ against floating-point rounding before it is compared with τ, as in the paper's code, so it doesn't decide the edge.",
          "sm-hint"
        )
      );
    out.push(
      para(
        state.pinned ? "Click or tap the edge again, or anywhere else on the map, to let go." : "Click or tap to keep this edge selected.",
        "sm-hint"
      )
    );
    return out;
  }

  // ---- chart: how the edges split between the stages at every threshold ----
  function buildChart() {
    const g = state.g,
      rows = state.rows;
    const W = Math.max(280, Math.round(chartBox.clientWidth || 640));
    const small = W < 520;
    const H = small ? 150 : 170;
    const m = { l: small ? 40 : 46, r: 10, t: 10, b: 36 };
    const x = (k) => m.l + ((k + C.KMAX) / (2 * C.KMAX)) * (W - m.l - m.r);
    const y = (f) => m.t + (1 - f) * (H - m.t - m.b);
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, class: "sm-chart-svg", role: "img" });
    svg.setAttribute("aria-label", "Share of the edges decided at each stage, for every threshold τ from −1 to 1");
    let base = rows.map(() => 0);
    const bands = [];
    for (let s = 0; s < C.STAGES; s++) {
      const top = rows.map((r, j) => base[j] + r.here[s] / g.m);
      const upper = rows.map((r, j) => x(r.k).toFixed(1) + "," + y(top[j]).toFixed(1));
      const lower = rows.map((r, j) => x(r.k).toFixed(1) + "," + y(base[j]).toFixed(1)).reverse();
      const band = el("polygon", { points: upper.concat(lower).join(" "), class: "sm-band sm-band-" + s });
      svg.appendChild(band);
      bands.push(band);
      base = top;
    }
    for (const f of [0, 0.5, 1]) {
      svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: y(f), y2: y(f), class: "sm-grid" }));
      svg.appendChild(el("text", { x: m.l - 6, y: y(f) + 4, class: "sm-tick", "text-anchor": "end" }, 100 * f + "%"));
    }
    for (const t of [-1, -0.5, 0, 0.5, 1]) {
      svg.appendChild(el("text", { x: x(100 * t), y: H - m.b + 16, class: "sm-tick", "text-anchor": "middle" }, minus(String(t))));
    }
    svg.appendChild(el("text", { x: (m.l + W - m.r) / 2, y: H - 4, class: "sm-axis", "text-anchor": "middle" }, "Threshold τ"));
    const marker = el("line", { y1: m.t - 4, y2: H - m.b, class: "sm-marker" });
    svg.appendChild(marker);
    chartBox.replaceChildren(svg);
    chart = { svg, bands, marker, x, m, W };

    // pressing or dragging along the chart moves the threshold
    const fromChart = (e) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
      const f = (p.x - m.l) / (W - m.l - m.r);
      setK(Math.round(Math.min(1, Math.max(0, f)) * 2 * C.KMAX - C.KMAX));
    };
    svg.addEventListener("pointerdown", (e) => {
      svg.setPointerCapture(e.pointerId);
      fromChart(e);
    });
    svg.addEventListener("pointermove", (e) => {
      if (svg.hasPointerCapture(e.pointerId)) fromChart(e);
    });
    moveMarker();
    markStage();
  }

  function moveMarker() {
    if (!chart) return;
    const xx = chart.x(state.k).toFixed(1);
    chart.marker.setAttribute("x1", xx);
    chart.marker.setAttribute("x2", xx);
  }

  function markStage() {
    if (chart) chart.bands.forEach((band, s) => band.classList.toggle("sm-band-on", s === state.stage));
  }

  // ---- iddt: Doom's automap cheat reveals the whole map ----
  const shownStage = () => (state.automap ? C.STAGES - 1 : state.stage);
  const automapTag = document.createElement("p");
  automapTag.className = "sm-automap-tag";
  automapTag.hidden = true;
  automapTag.textContent = "AUTOMAP \u00b7 type iddt again to leave";
  const legends = { plain: q(".sm-legend-plain"), auto: q(".sm-legend-auto") };
  function setAutomap(on) {
    state.automap = on;
    root.classList.toggle("sm-automap", on);
    automapTag.hidden = !on;
    if (legends.plain) legends.plain.hidden = on;
    if (legends.auto) legends.auto.hidden = !on;
    if (!state.g) return;
    if (!on && state.hover >= 0 && state.st[state.hover] > state.stage) {
      state.hover = -1;
      state.pinned = false;
    }
    redraw();
  }
  const isTextEntry = (t) =>
    !!t &&
    (t.isContentEditable ||
      t.tagName === "TEXTAREA" ||
      t.tagName === "SELECT" ||
      (t.tagName === "INPUT" && !/^(radio|checkbox|range|button|submit|reset)$/.test(t.type)) ||
      !!(t.closest && t.closest("ninja-keys")));
  let typed = "";
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1 || isTextEntry(e.target)) return;
    typed = (typed + e.key.toLowerCase()).slice(-4);
    if (typed === "iddt") {
      typed = "";
      setAutomap(!state.automap);
    }
  });

  // ---- controls ----
  root.querySelectorAll('input[name="sm-graph"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.family = input.value;
      rggOnly.forEach((node) => (node.hidden = state.family !== "rgg"));
      load();
    })
  );
  root.querySelectorAll('input[name="sm-degree"]').forEach((input) =>
    input.addEventListener("change", () => {
      state.degree = Number(input.value);
      state.seed = 0;
      load();
    })
  );
  q(".sm-another").addEventListener("click", () => {
    state.seed = (state.seed + 1) % SEEDS;
    load();
  });
  stepInputs.forEach((input) =>
    input.addEventListener("change", () => {
      state.stage = Number(input.value);
      if (!state.g) return;
      if (state.hover >= 0 && state.st[state.hover] > shownStage()) {
        state.hover = -1;
        state.pinned = false;
      }
      markStage();
      redraw();
    })
  );
  tauInput.addEventListener("input", () => setK(Number(tauInput.value)));
  q(".sm-tau-reset").addEventListener("click", () => setK(0));

  let resizeFrame = 0,
    lastWidth = 0;
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      const w = Math.round(chartBox.clientWidth);
      if (!state.g || w === lastWidth) return;
      lastWidth = w;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(buildChart);
    }).observe(chartBox);
  }
  load();
})();
