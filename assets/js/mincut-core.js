// Core of the min-cut demo (no DOM). For one edge and a one-step measure it builds the
// layered network of the paper (Corollary 3), runs a maximum flow, and reads the optimal
// potentials and a transport plan off the cut (Proposition 5). Exported for testing in Node.
"use strict";

const MinCutCore = (function () {
  // Graph from the screening-map data files: edge list and positions.
  function decode(raw) {
    const n = raw.n,
      m = raw.m;
    const u = new Int32Array(m),
      v = new Int32Array(m),
      deg = new Int32Array(n);
    for (let e = 0; e < m; e++) {
      u[e] = raw.edges[2 * e];
      v[e] = raw.edges[2 * e + 1];
      deg[u[e]]++;
      deg[v[e]]++;
    }
    const adj = Array.from({ length: n }, () => []);
    for (let e = 0; e < m; e++) {
      adj[u[e]].push(v[e]);
      adj[v[e]].push(u[e]);
    }
    adj.forEach((a) => a.sort((p, q) => p - q));
    const nbr = adj.map((a) => new Set(a));
    const x = new Float64Array(n),
      y = new Float64Array(n);
    for (let k = 0; k < n; k++) {
      x[k] = raw.pos[2 * k] / 10000;
      y[k] = raw.pos[2 * k + 1] / 10000;
    }
    // exact lazy curvature from orcut, stored with the data
    let kappa = null;
    if (raw.kappa && raw.vals) {
      kappa = new Float64Array(m);
      for (let e = 0; e < m; e++) kappa[e] = raw.vals[raw.kappa[e]];
    }
    return { graph: raw.graph, n, m, u, v, deg, adj, nbr, x, y, kappa };
  }

  const gcd = (a, b) => {
    while (b) [a, b] = [b, a % b];
    return a;
  };

  // Integer masses with a common denominator Lam (Section B of the paper).
  // Each measure gives the idleness a/b at the endpoint and spreads the rest uniformly.
  function masses(measure, di, dj) {
    let a, b;
    if (measure === "lazy") return { Lam: (di + 1) * (dj + 1), own: [dj + 1, di + 1], spread: [dj + 1, di + 1] };
    if (measure === "nonlazy") [a, b] = [0, 1];
    else if (measure === "lly") [a, b] = [1, Math.max(di, dj) + 1];
    else throw new Error("unknown measure " + measure);
    // m_i(i) = a/b, m_i(x) = (1 - a/b)/d_i on N(i); scaled by Lam = b d_i d_j
    return { Lam: b * di * dj, own: [a * di * dj, a * di * dj], spread: [(b - a) * dj, (b - a) * di] };
  }

  // The local transport problem of edge e: net masses on S = N[i] u N[j] and the distances on P x N,
  // decided by adjacency and common neighbours alone (Lemma 2).
  function problem(G, e, measure) {
    const i = G.u[e],
      j = G.v[e],
      di = G.deg[i],
      dj = G.deg[j];
    const M = masses(measure, di, dj);
    const mu = new Map();
    const add = (z, w) => mu.set(z, (mu.get(z) || 0) + w);
    add(i, M.own[0]);
    for (const z of G.adj[i]) add(z, M.spread[0]);
    add(j, -M.own[1]);
    for (const z of G.adj[j]) add(z, -M.spread[1]);
    const inNi = (z) => z === i || G.nbr[i].has(z),
      inNj = (z) => z === j || G.nbr[j].has(z);
    const P = [],
      N = [];
    for (const [z, w] of mu) {
      if (w > 0) P.push({ v: z, mass: w });
      else if (w < 0) N.push({ v: z, mass: -w });
    }
    P.sort((p, q) => p.v - q.v);
    N.sort((p, q) => p.v - q.v);
    // divide out any common factor so the flow numbers stay small
    let g = M.Lam;
    for (const p of P) g = gcd(g, p.mass);
    for (const q of N) g = gcd(g, q.mass);
    const Lam = M.Lam / g;
    P.forEach((p) => (p.mass /= g));
    N.forEach((q) => (q.mass /= g));
    const A = P.reduce((s, p) => s + p.mass, 0);
    const common = (x, y) => {
      const [s, t] = G.adj[x].length <= G.adj[y].length ? [x, y] : [y, x];
      for (const w of G.adj[s]) if (G.nbr[t].has(w)) return true;
      return false;
    };
    const dist = new Int8Array(P.length * N.length);
    P.forEach((p, a) => {
      const xUi = !inNj(p.v);
      N.forEach((q, b) => {
        let d;
        if (G.nbr[p.v].has(q.v)) d = 1;
        else if (xUi && !inNi(q.v)) d = common(p.v, q.v) ? 2 : 3;
        else d = 2;
        dist[a * N.length + b] = d;
      });
    });
    return { e, i, j, di, dj, measure, Lam, P, N, A, dist };
  }

  // A small Dinic maximum flow on integer capacities.
  function Flow(nNodes) {
    this.n = nNodes;
    this.head = new Int32Array(nNodes).fill(-1);
    this.to = [];
    this.cap = [];
    this.next = [];
  }
  Flow.prototype.arc = function (a, b, c) {
    const k = this.to.length;
    this.to.push(b, a);
    this.cap.push(c, 0);
    this.next.push(this.head[a], this.head[b]);
    this.head[a] = k;
    this.head[b] = k + 1;
    return k;
  };
  Flow.prototype.run = function (s, t) {
    const n = this.n,
      to = this.to,
      cap = this.cap,
      next = this.next,
      head = this.head;
    const level = new Int32Array(n),
      it = new Int32Array(n),
      queue = new Int32Array(n);
    let total = 0;
    const bfs = () => {
      level.fill(-1);
      level[s] = 0;
      let qh = 0,
        qt = 0;
      queue[qt++] = s;
      while (qh < qt) {
        const a = queue[qh++];
        for (let k = head[a]; k !== -1; k = next[k])
          if (cap[k] > 0 && level[to[k]] < 0) {
            level[to[k]] = level[a] + 1;
            queue[qt++] = to[k];
          }
      }
      return level[t] >= 0;
    };
    const dfs = (a, f) => {
      if (a === t) return f;
      for (; it[a] !== -1; it[a] = next[it[a]]) {
        const k = it[a],
          b = to[k];
        if (cap[k] > 0 && level[b] === level[a] + 1) {
          const got = dfs(b, Math.min(f, cap[k]));
          if (got > 0) {
            cap[k] -= got;
            cap[k ^ 1] += got;
            return got;
          }
        }
      }
      return 0;
    };
    this.phases = 0;
    while (bfs()) {
      this.phases++;
      for (let a = 0; a < n; a++) it[a] = head[a];
      let f;
      while ((f = dfs(s, Infinity)) > 0) total += f;
    }
    return total;
  };
  // nodes reachable from s in the residual network: the source side of a minimum cut
  Flow.prototype.sourceSide = function (s) {
    const seen = new Uint8Array(this.n),
      stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const a = stack.pop();
      for (let k = this.head[a]; k !== -1; k = this.next[k])
        if (this.cap[k] > 0 && !seen[this.to[k]]) {
          seen[this.to[k]] = 1;
          stack.push(this.to[k]);
        }
    }
    return seen;
  };
  Flow.prototype.flowOn = function (k) {
    return this.cap[k ^ 1];
  };

  // Node numbering of the network: s, t, then a(x,3), a(x,2) for x in P and b(y,2), b(y,1) for y in N.
  const S = 0,
    T = 1;
  const a3 = (a) => 2 + 2 * a,
    a2 = (a) => 3 + 2 * a;
  const b2 = (pr, b) => 2 + 2 * pr.P.length + 2 * b,
    b1 = (pr, b) => 3 + 2 * pr.P.length + 2 * b;

  // The layered network of Corollary 3: the chains a(x,3) -> a(x,2), and, for each pair, two arcs at
  // distance 1, one at distance 2 and none at distance 3. Infinite capacities are capped at 3A + 1.
  function network(pr) {
    const nP = pr.P.length,
      nN = pr.N.length,
      INF = 3 * pr.A + 1;
    const G = new Flow(2 + 2 * (nP + nN));
    const arcs = [];
    const add = (a, b, c, kind, x, y) => arcs.push({ a, b, kind, x, y, k: G.arc(a, b, c) });
    pr.P.forEach((p, a) => {
      add(S, a3(a), p.mass, "source", a, -1);
      add(S, a2(a), p.mass, "source", a, -1);
      add(a3(a), a2(a), INF, "chain", a, -1);
    });
    pr.N.forEach((q, b) => {
      add(b2(pr, b), T, q.mass, "sink", -1, b);
      add(b1(pr, b), T, q.mass, "sink", -1, b);
    });
    pr.P.forEach((p, a) =>
      pr.N.forEach((q, b) => {
        const d = pr.dist[a * nN + b];
        if (d === 1) {
          add(a3(a), b2(pr, b), INF, "d1", a, b);
          add(a2(a), b1(pr, b), INF, "d1", a, b);
        } else if (d === 2) add(a3(a), b1(pr, b), INF, "d2", a, b);
      })
    );
    return { flow: G, arcs, nodes: 2 + 2 * (nP + nN) };
  }

  // Solve one edge and check the answer: the potentials read off the cut are feasible for the dual,
  // and a plan on the tight pairs moves all the mass at the same cost.
  function solve(G, e, measure) {
    const pr = problem(G, e, measure);
    const nP = pr.P.length,
      nN = pr.N.length;
    const out = { pr, A: pr.A, Lam: pr.Lam };
    if (pr.A === 0) {
      Object.assign(out, { F: 0, W1num: 0, kappa: 1, net: null, u: [], v: [], plan: [], checked: true, phases: 0 });
      return finish(out, G, pr);
    }
    const net = network(pr);
    const F = net.flow.run(S, T);
    const Z = net.flow.sourceSide(S);
    const u = pr.P.map((_, a) => 1 + Z[a3(a)] + Z[a2(a)]);
    const v = pr.N.map((_, b) => Z[b2(pr, b)] + Z[b1(pr, b)]);
    const W1num = 3 * pr.A - F;
    // dual feasibility on every pair and the dual value
    let feasible = true;
    for (let a = 0; a < nP; a++) for (let b = 0; b < nN; b++) if (u[a] - v[b] > pr.dist[a * nN + b]) feasible = false;
    const dual = pr.P.reduce((s, p, a) => s + p.mass * u[a], 0) - pr.N.reduce((s, q, b) => s + q.mass * v[b], 0);
    // a transport plan on the tight pairs, by one bipartite flow
    const B = new Flow(2 + nP + nN),
      pairArc = [];
    pr.P.forEach((p, a) => B.arc(S, 2 + a, p.mass));
    pr.N.forEach((q, b) => B.arc(2 + nP + b, T, q.mass));
    for (let a = 0; a < nP; a++)
      for (let b = 0; b < nN; b++)
        if (u[a] - v[b] === pr.dist[a * nN + b]) pairArc.push({ a, b, k: B.arc(2 + a, 2 + nP + b, pr.A) });
    const moved = B.run(S, T);
    const plan = [];
    let cost = 0;
    for (const p of pairArc) {
      const f = B.flowOn(p.k);
      if (f > 0) {
        plan.push({ a: p.a, b: p.b, amount: f, d: pr.dist[p.a * nN + p.b] });
        cost += f * pr.dist[p.a * nN + p.b];
      }
    }
    Object.assign(out, {
      net,
      F,
      Z,
      u,
      v,
      W1num,
      plan,
      phases: net.flow.phases,
      dual,
      cost,
      moved,
      checked: feasible && moved === pr.A && cost === W1num && dual === W1num,
    });
    return finish(out, G, pr);
  }

  function finish(out, G, pr) {
    const W1 = out.W1num / pr.Lam;
    out.W1 = W1;
    out.kappa = 1 - W1;
    // Lin-Lu-Yau: kappa_p at idleness p = 1/(rho + 1), rescaled by (rho + 1)/rho
    if (pr.measure === "lly") {
      const rho = Math.max(pr.di, pr.dj);
      out.kappaLLY = ((rho + 1) / rho) * out.kappa;
    }
    out.orcut = pr.measure === "lazy" && G.kappa ? G.kappa[pr.e] : null;
    return out;
  }

  return { decode, masses, problem, network, solve, nodes: { S, T, a3, a2, b2, b1 } };
})();

if (typeof module !== "undefined") module.exports = MinCutCore;
