// Interactive figure for /projects/min-cut/: the layered network of one edge, its minimum cut, and the
// potentials and transport plan read off the cut.
(function () {
  "use strict";
  const root = document.getElementById("min-cut");
  if (!root || typeof MinCutCore === "undefined") return;
  const C = MinCutCore;
  const NS = "http://www.w3.org/2000/svg";
  // default edges (0-based endpoints): one whose cut uses all three levels, at a readable size
  const DEFAULT = { karate: [23, 27], "rgg-d8-s0": null };
  const NAMES = { karate: "the karate club", "rgg-d8-s0": "the random geometric graph" };
  const MEASURES = { lazy: "lazy walk", nonlazy: "non-lazy walk", lly: "Lin–Lu–Yau curvature" };

  const q = (s) => root.querySelector(s);
  const graphBox = q(".mc-graph"),
    netBox = q(".mc-net"),
    readout = q(".mc-readout"),
    status = q(".mc-status"),
    live = q(".mc-live");
  const state = { graph: "karate", measure: "lazy", e: -1, G: null, r: null, hover: -1 };
  const cache = new Map();
  let token = 0,
    view = null,
    pointerType = "mouse";

  // ---- formatting ----
  const minus = (s) => String(s).replace(/-/g, "−");
  const gcd = (a, b) => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a;
  };
  const frac = (p, q) => {
    if (p === 0) return "0";
    const g = gcd(p, q);
    return q / g === 1 ? minus(p / g) : minus(p / g) + "/" + q / g;
  };
  const dec = (x) => (Math.abs(x) < 1e-12 ? "0" : minus(x.toFixed(4).replace(/\.?0+$/, "")));
  const label = (G, z) => String(z + 1);

  function el(name, attrs, parent, text) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }
  function html(tag, parent, text) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }

  // ---- data ----
  function load(key) {
    if (!cache.has(key))
      cache.set(
        key,
        fetch(root.dataset.src + key + ".json")
          .then((response) => {
            if (!response.ok) throw new Error("HTTP " + response.status);
            return response.json();
          })
          .then(C.decode)
          .catch((err) => {
            cache.delete(key);
            throw err;
          })
      );
    return cache.get(key);
  }

  function findEdge(G, a, b) {
    for (let e = 0; e < G.m; e++) if ((G.u[e] === a && G.v[e] === b) || (G.u[e] === b && G.v[e] === a)) return e;
    return 0;
  }

  function choose(key) {
    const mine = ++token;
    status.textContent = "Loading the graph…";
    load(key).then(
      (G) => {
        if (mine !== token) return;
        state.graph = key;
        state.G = G;
        const d = DEFAULT[key];
        select(d ? findEdge(G, d[0], d[1]) : 0);
        status.textContent = "Click an edge of the graph to see its network.";
      },
      () => {
        if (mine === token) status.textContent = "This graph couldn’t be loaded. Check your connection and choose it again.";
      }
    );
  }

  function select(e) {
    state.e = e;
    state.r = C.solve(state.G, e, state.measure);
    drawGraph();
    drawNetwork();
    writeReadout();
  }

  // ---- the graph, around the chosen edge ----
  const GW = 800,
    GH = 480,
    GPAD = 28;
  function drawGraph() {
    const G = state.G,
      r = state.r,
      pr = r.pr;
    const local = state.graph !== "karate";
    // vertices of S = N[i] u N[j], which hold the masses
    const S = new Set([pr.i, pr.j, ...G.adj[pr.i], ...G.adj[pr.j]]);
    let x0 = Infinity,
      x1 = -Infinity,
      y0 = Infinity,
      y1 = -Infinity;
    const box = local ? S : G.adj.keys();
    for (const z of box) {
      x0 = Math.min(x0, G.x[z]);
      x1 = Math.max(x1, G.x[z]);
      y0 = Math.min(y0, G.y[z]);
      y1 = Math.max(y1, G.y[z]);
    }
    // a drawing taller than wide is turned a quarter, to fit the wide panel
    const turn = y1 - y0 > 1.2 * (x1 - x0);
    const bw = turn ? y1 - y0 : x1 - x0,
      bh = turn ? x1 - x0 : y1 - y0;
    const s = Math.min((GW - 2 * GPAD) / Math.max(bw, 1e-9), (GH - 2 * GPAD) / Math.max(bh, 1e-9));
    const ox = (GW - s * bw) / 2,
      oy = (GH - s * bh) / 2;
    const X = (z) => ox + s * (turn ? G.y[z] - y0 : G.x[z] - x0),
      Y = (z) => GH - (oy + s * (turn ? x1 - G.x[z] : G.y[z] - y0));
    view = { X, Y };

    graphBox.textContent = "";
    const svg = el("svg", { viewBox: `0 0 ${GW} ${GH}`, class: "mc-svg", role: "img" }, graphBox);
    el("title", {}, svg, `${NAMES[state.graph]}, with edge ${label(G, pr.i)}–${label(G, pr.j)} chosen`);
    // all edges, as one path; on the local view only those with an end in sight
    let d = "";
    const inView = (z) => X(z) > -40 && X(z) < GW + 40 && Y(z) > -40 && Y(z) < GH + 40;
    for (let e = 0; e < G.m; e++) {
      const a = G.u[e],
        b = G.v[e];
      if (local && !inView(a) && !inView(b)) continue;
      d += `M${X(a).toFixed(1)} ${Y(a).toFixed(1)}L${X(b).toFixed(1)} ${Y(b).toFixed(1)}`;
    }
    el("path", { d, class: "mc-edges" }, svg);
    if (!local) for (let z = 0; z < G.n; z++) el("circle", { cx: X(z).toFixed(1), cy: Y(z).toFixed(1), r: 2.6, class: "mc-vertex" }, svg);
    // the transport plan, solid at distance 1, dashed at 2, dotted at 3
    const planG = el("g", { class: "mc-plan" }, svg);
    for (const p of r.plan) {
      const a = pr.P[p.a].v,
        b = pr.N[p.b].v;
      el("line", { x1: X(a), y1: Y(a), x2: X(b), y2: Y(b), class: "mc-plan-" + p.d, "stroke-width": (1 + 4 * Math.sqrt(p.amount / r.A)).toFixed(2) }, planG);
    }
    // the chosen edge and the hover
    el("line", { x1: X(pr.i), y1: Y(pr.i), x2: X(pr.j), y2: Y(pr.j), class: "mc-chosen" }, svg);
    const hover = el("line", { class: "mc-hover", x1: 0, y1: 0, x2: 0, y2: 0, visibility: "hidden" }, svg);
    // masses: red sends, blue receives, area proportional to net mass
    const massG = el("g", {}, svg);
    const put = (z, mass, cls, what) => {
      const c = el("circle", { cx: X(z), cy: Y(z), r: (3.5 + 9 * Math.sqrt(mass / r.A)).toFixed(2), class: cls }, massG);
      el("title", {}, c, `vertex ${label(G, z)}: ${what} ${frac(mass, r.Lam)}`);
    };
    pr.P.forEach((p) => put(p.v, p.mass, "mc-send", "sends"));
    pr.N.forEach((q) => put(q.v, q.mass, "mc-recv", "receives"));
    for (const z of [pr.i, pr.j]) el("circle", { cx: X(z), cy: Y(z), r: 5, class: "mc-end" }, svg);
    if (state.graph === "karate" || S.size <= 40)
      for (const z of S) {
        const t = el("text", { x: X(z) + 9, y: Y(z) - 7, class: "mc-vlabel" }, svg, label(G, z));
        if (z === pr.i || z === pr.j) t.classList.add("mc-vlabel-end");
      }

    // picking: the nearest edge within a few screen pixels
    const nearest = (cx, cy, tol) => {
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return -1;
      const k = GW / rect.width,
        px = (cx - rect.left) * k,
        py = (cy - rect.top) * k;
      let best = -1,
        bd = (tol * k) ** 2;
      for (let e = 0; e < G.m; e++) {
        const ax = X(G.u[e]),
          ay = Y(G.u[e]),
          bx = X(G.v[e]),
          by = Y(G.v[e]);
        const dx = bx - ax,
          dy = by - ay,
          L = dx * dx + dy * dy;
        const t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0;
        const ex = ax + t * dx - px,
          ey = ay + t * dy - py,
          dd = ex * ex + ey * ey;
        if (dd < bd) {
          bd = dd;
          best = e;
        }
      }
      return best;
    };
    svg.addEventListener("pointerdown", (ev) => (pointerType = ev.pointerType || "mouse"));
    svg.addEventListener("pointermove", (ev) => {
      if (ev.pointerType && ev.pointerType !== "mouse") return;
      const e = nearest(ev.clientX, ev.clientY, 8);
      if (e < 0 || e === state.e) return hover.setAttribute("visibility", "hidden");
      hover.setAttribute("x1", X(G.u[e]));
      hover.setAttribute("y1", Y(G.u[e]));
      hover.setAttribute("x2", X(G.v[e]));
      hover.setAttribute("y2", Y(G.v[e]));
      hover.setAttribute("visibility", "visible");
    });
    svg.addEventListener("pointerleave", () => hover.setAttribute("visibility", "hidden"));
    svg.addEventListener("click", (ev) => {
      const e = nearest(ev.clientX, ev.clientY, pointerType === "mouse" ? 8 : 18);
      if (e >= 0 && e !== state.e) select(e);
    });
  }

  // ---- the layered network and its cut ----
  function drawNetwork() {
    const G = state.G,
      r = state.r,
      pr = r.pr;
    netBox.textContent = "";
    if (!r.net) {
      html("p", netBox, "The two walks give every vertex the same mass, so nothing has to move: W₁ = 0 and κ = 1.").className = "mc-empty";
      return;
    }
    const N = C.nodes,
      Z = r.Z;
    // rows sorted by potential, so the source side gathers at the top of each band
    const orderP = pr.P.map((_, a) => a).sort((a, b) => r.u[b] - r.u[a] || pr.P[b].mass - pr.P[a].mass || a - b);
    const orderN = pr.N.map((_, b) => b).sort((a, b) => r.v[b] - r.v[a] || pr.N[b].mass - pr.N[a].mass || a - b);
    const rows = Math.max(orderP.length, orderN.length),
      RH = 21,
      TOP = 46,
      GAP = 54;
    const bandH = rows * RH,
      W = 800,
      H = TOP + 2 * bandH + GAP + 20;
    const XS = 34,
      XT = W - 34,
      XA = [0, 0, 300, 268],
      XB = [0, 532, 500]; // XA[tau], XB[sigma]: the top band holds a(x,3) and b(y,2), the bottom one a(x,2) and b(y,1)
    const yRow = (k, n, band) => TOP + band * (bandH + GAP) + (k + 0.5 + (rows - n) / 2) * RH;
    const pos = new Map();
    orderP.forEach((a, k) => {
      pos.set(N.a3(a), [XA[3], yRow(k, orderP.length, 0)]);
      pos.set(N.a2(a), [XA[2], yRow(k, orderP.length, 1)]);
    });
    orderN.forEach((b, k) => {
      pos.set(N.b2(pr, b), [XB[2], yRow(k, orderN.length, 0)]);
      pos.set(N.b1(pr, b), [XB[1], yRow(k, orderN.length, 1)]);
    });
    const midY = TOP + bandH + GAP / 2;
    pos.set(N.S, [XS, midY]);
    pos.set(N.T, [XT, midY]);

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "mc-svg mc-netsvg", role: "img" }, netBox);
    el("title", {}, svg, "The layered network of the chosen edge and a minimum cut");
    // band labels: a node is on the source side exactly when its vertex's potential reaches its level
    const head = (x, y, text, anchor) => el("text", { x, y, class: "mc-head", "text-anchor": anchor || "middle" }, svg, text);
    head(XA[3], TOP - 14, "u ≥ 3");
    head(XB[2], TOP - 14, "v ≥ 2");
    head(XA[2], TOP + bandH + GAP - 14, "u ≥ 2");
    head(XB[1], TOP + bandH + GAP - 14, "v ≥ 1");
    head(XS, midY - 14, "s");
    head(XT, midY - 14, "t");

    const gArcs = el("g", {}, svg),
      gCut = el("g", {}, svg),
      gNodes = el("g", {}, svg);
    let maxFlow = 0;
    for (const arc of r.net.arcs) if (arc.kind === "d1" || arc.kind === "d2" || arc.kind === "chain") maxFlow = Math.max(maxFlow, r.net.flow.flowOn(arc.k));
    for (const arc of r.net.arcs) {
      const [x1, y1] = pos.get(arc.a),
        [x2, y2] = pos.get(arc.b),
        f = r.net.flow.flowOn(arc.k);
      if (arc.kind === "source" || arc.kind === "sink") {
        // a finite arc is cut when it leaves the source side
        const cut = Z[arc.a] && !Z[arc.b];
        el("line", { x1, y1, x2, y2, class: cut ? "mc-cut" : "mc-st" }, cut ? gCut : gArcs);
      } else {
        const cls = "mc-arc mc-" + arc.kind + (f > 0 ? " mc-flow" : "");
        const w = f > 0 ? (1.2 + 2.6 * (f / maxFlow)).toFixed(2) : null;
        const ln = el("line", { x1, y1, x2, y2, class: cls }, gArcs);
        if (w) ln.setAttribute("stroke-width", w);
      }
    }
    const node = (id, cls, tip) => {
      const [x, y] = pos.get(id);
      const c = el("circle", { cx: x, cy: y, r: 6, class: cls + (Z[id] ? " mc-in" : "") }, gNodes);
      el("title", {}, c, tip);
    };
    for (const id of [N.S, N.T]) node(id, "mc-term", id === N.S ? "source s" : "sink t");
    orderP.forEach((a) => {
      const p = pr.P[a],
        tip = `vertex ${label(G, p.v)}: sends ${frac(p.mass, r.Lam)}, potential u = ${r.u[a]}`;
      node(N.a3(a), "mc-a", tip);
      node(N.a2(a), "mc-a", tip);
    });
    orderN.forEach((b) => {
      const qv = pr.N[b],
        tip = `vertex ${label(G, qv.v)}: receives ${frac(qv.mass, r.Lam)}, potential v = ${r.v[b]}`;
      node(N.b2(pr, b), "mc-b", tip);
      node(N.b1(pr, b), "mc-b", tip);
    });
    // vertex names beside the rows of the top band
    if (rows <= 24) {
      orderP.forEach((a, k) => el("text", { x: XA[3] - 13, y: yRow(k, orderP.length, 0) + 4, class: "mc-rlabel", "text-anchor": "end" }, svg, label(G, pr.P[a].v)));
      orderN.forEach((b, k) => el("text", { x: XB[2] + 13, y: yRow(k, orderN.length, 0) + 4, class: "mc-rlabel" }, svg, label(G, pr.N[b].v)));
    }
  }

  // ---- numbers ----
  function writeReadout() {
    const G = state.G,
      r = state.r,
      pr = r.pr;
    readout.textContent = "";
    const p1 = html("p", readout);
    p1.append(`Edge ${label(G, pr.i)}–${label(G, pr.j)} of ${NAMES[state.graph]}, with degrees ${pr.di} and ${pr.dj}, under the ${MEASURES[state.measure]}`);
    if (state.measure === "lly") p1.append(` (idleness 1/${Math.max(pr.di, pr.dj) + 1})`);
    p1.append(".");
    if (r.A === 0) {
      html("p", readout, "The two measures are equal, so W₁ = 0 and κ = 1.");
      live.textContent = "κ = 1";
      return;
    }
    const nP = pr.P.length,
      nN = pr.N.length;
    let d1 = 0,
      d2 = 0,
      d3 = 0;
    for (const d of pr.dist) d === 1 ? d1++ : d === 2 ? d2++ : d3++;
    html("p", readout, `${nP} red ${nP === 1 ? "vertex sends" : "vertices send"} a net mass A = ${frac(r.A, r.Lam)} to ${nN} blue ${nN === 1 ? "one" : "ones"}. Of the ${nP * nN} pairs between them, ${d1} ${d1 === 1 ? "is" : "are"} at distance 1, ${d2} at distance 2 and ${d3} at distance 3, all decided from adjacency lists.`);
    html("p", readout, `The network has ${r.net.nodes} nodes and ${r.net.arcs.length} arcs, and a maximum flow F = ${frac(r.F, r.Lam)} takes ${r.phases} ${r.phases === 1 ? "phase" : "phases"} of Dinic’s algorithm, so W₁ = 3A − F = ${frac(r.W1num, r.Lam)} and κ = 1 − W₁ = ${dec(r.kappa)}.`);
    if (state.measure === "lly") {
      const rho = Math.max(pr.di, pr.dj);
      html("p", readout, `The Lin–Lu–Yau curvature is ${rho + 1}/${rho} times that: ${dec(r.kappaLLY)}.`);
    }
    const ok = html("p", readout);
    ok.className = "mc-check";
    ok.textContent = r.checked
      ? `Checked: the potentials read off the cut satisfy all ${nP * nN} constraints u − v ≤ dist, and a plan along the pairs where they are tight moves all of A at the same cost, W₁ = ${frac(r.cost, r.Lam)}.`
      : "The certificate did not check out on this edge.";
    if (r.orcut !== null) html("p", readout, `orcut, the paper’s solver, gives ${dec(r.orcut)} for this edge.`).className = "mc-aside";
    live.textContent = `Edge ${label(G, pr.i)}–${label(G, pr.j)}: κ = ${dec(state.measure === "lly" ? r.kappaLLY : r.kappa)}`;
  }

  // ---- controls ----
  root.querySelectorAll('input[name="mc-graph"]').forEach((input) => input.addEventListener("change", () => input.checked && choose(input.value)));
  root.querySelectorAll('input[name="mc-measure"]').forEach((input) =>
    input.addEventListener("change", () => {
      if (!input.checked) return;
      state.measure = input.value;
      if (state.G) select(state.e);
    })
  );
  q(".mc-random").addEventListener("click", () => {
    if (!state.G) return;
    let e = state.e;
    while (state.G.m > 1 && e === state.e) e = Math.floor(Math.random() * state.G.m);
    select(e);
  });
  choose(state.graph);
})();
