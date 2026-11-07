// Core of the screening-map demo (no DOM): decodes the precomputed data and runs certify-then-solve. Exported for testing in Node.
"use strict";

const ScreeningCore = (function () {
  // Every interval is widened by this before it is compared with tau, as in curvature_transfer (intervals.ROUNDING_TOL).
  const TOL = 1e-9;
  // The slider's thresholds are tau = k / 100 for k = -KMAX, ..., KMAX.
  const KMAX = 100;
  const STAGES = 4;

  // Full-precision values are stored once per graph; each column holds an index into them.
  function decode(raw) {
    const m = raw.m,
      vals = raw.vals;
    const column = (name) => {
      const idx = raw[name],
        out = new Float64Array(m);
      for (let i = 0; i < m; i++) out[i] = vals[idx[i]];
      return out;
    };
    const u = new Int32Array(m),
      v = new Int32Array(m),
      deg = new Int32Array(raw.n);
    for (let i = 0; i < m; i++) {
      u[i] = raw.edges[2 * i];
      v[i] = raw.edges[2 * i + 1];
      deg[u[i]]++;
      deg[v[i]]++;
    }
    const x = new Float64Array(raw.n),
      y = new Float64Array(raw.n);
    for (let j = 0; j < raw.n; j++) {
      x[j] = raw.pos[2 * j] / 10000;
      y[j] = raw.pos[2 * j + 1] / 10000;
    }
    const lo2 = column("lo");
    return {
      graph: raw.graph,
      seed: raw.seed,
      n: raw.n,
      m,
      u,
      v,
      deg,
      x,
      y,
      // stage 0: BF interval, 1: 2-hop interval, 2: 2-hop interval intersected with the TLW certificate (same lower end)
      lo: [column("bfLo"), lo2, lo2],
      up: [column("bfUp"), column("up2"), column("up3")],
      kappa: column("kappa"),
      bf: column("bf"),
    };
  }

  const tauOf = (k) => k / 100;

  // Whether [lo, up], widened by TOL, decides {kappa_OR < tau}: certify_threshold of curvature_transfer.
  const decides = (lo, up, tau) => up + TOL < tau || lo - TOL >= tau;

  // Stage (0-3) that decides each edge, as screening_map.stages_from_store: the first interval that decides it, else 3 (the exact solver).
  function stages(g, tau, out) {
    const st = out || new Int8Array(g.m);
    for (let i = 0; i < g.m; i++) {
      let s = STAGES - 1;
      for (let k = STAGES - 2; k >= 0; k--) if (decides(g.lo[k][i], g.up[k][i], tau)) s = k;
      st[i] = s;
    }
    return st;
  }

  // Edges decided at each stage, and how many of them have kappa_OR < tau.
  function counts(g, st, tau) {
    const here = [0, 0, 0, 0],
      below = [0, 0, 0, 0];
    for (let i = 0; i < g.m; i++) {
      here[st[i]]++;
      if (g.kappa[i] < tau) below[st[i]]++;
    }
    return { here, below };
  }

  // Edges decided at each stage at every threshold of the slider, for the chart.
  function sweep(g) {
    const st = new Int8Array(g.m),
      rows = [];
    for (let k = -KMAX; k <= KMAX; k++) {
      const tau = tauOf(k);
      stages(g, tau, st);
      const here = [0, 0, 0, 0];
      for (let i = 0; i < g.m; i++) here[st[i]]++;
      rows.push({ k, tau, here });
    }
    return rows;
  }

  // For an edge left undecided at stage s: whether its lower end is tau up to the tolerance. Such an interval shows
  // kappa_OR >= tau, but the widening keeps it from deciding. (An upper end at tau decides nothing: the query is strict.)
  function heldByTolerance(g, s, i, tau) {
    return !decides(g.lo[s][i], g.up[s][i], tau) && Math.abs(g.lo[s][i] - tau) <= TOL;
  }

  return { TOL, KMAX, STAGES, decode, tauOf, decides, stages, counts, sweep, heldByTolerance };
})();

if (typeof module !== "undefined") module.exports = ScreeningCore;
