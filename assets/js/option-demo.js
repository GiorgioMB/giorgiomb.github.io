// Interactive option pricer for /projects/option-pricing/: Monte Carlo with error bars, checked against Black-Scholes.
(function () {
  "use strict";
  const root = document.getElementById("option-demo");
  if (!root) return;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normalSampler(rand) {
    let spare = null;
    return function () {
      if (spare !== null) {
        const s = spare;
        spare = null;
        return s;
      }
      let u, v, s;
      do {
        u = 2 * rand() - 1;
        v = 2 * rand() - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const m = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * m;
      return u * m;
    };
  }
  // Standard normal CDF via erfc (Numerical Recipes erfcc, |error| < 1.2e-7)
  function normCdf(x) {
    const z = Math.abs(x) / Math.SQRT2,
      t = 1 / (1 + 0.5 * z);
    const r =
      t *
      Math.exp(
        -z * z -
          1.26551223 +
          t *
            (1.00002368 +
              t *
                (0.37409196 +
                  t *
                    (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))
      );
    return x >= 0 ? 1 - 0.5 * r : 0.5 * r;
  }
  const normPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

  function blackScholes({ S, K, T, sigma, r, call }) {
    const sq = sigma * Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / sq,
      d2 = d1 - sq;
    const disc = Math.exp(-r * T);
    const price = call ? S * normCdf(d1) - K * disc * normCdf(d2) : K * disc * normCdf(-d2) - S * normCdf(-d1);
    const delta = call ? normCdf(d1) : normCdf(d1) - 1;
    const gamma = normPdf(d1) / (S * sq);
    const vega = (S * normPdf(d1) * Math.sqrt(T)) / 100; // per volatility point
    const thetaYear = call
      ? (-S * normPdf(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * disc * normCdf(d2)
      : (-S * normPdf(d1) * sigma) / (2 * Math.sqrt(T)) + r * K * disc * normCdf(-d2);
    return { price, delta, gamma, vega, theta: thetaYear / 365 };
  }

  // Cox-Ross-Rubinstein tree; american = true allows early exercise
  function binomial({ S, K, T, sigma, r, call }, steps, american) {
    const dt = T / steps,
      u = Math.exp(sigma * Math.sqrt(dt)),
      dn = 1 / u;
    const p = (Math.exp(r * dt) - dn) / (u - dn),
      disc = Math.exp(-r * dt);
    const v = new Float64Array(steps + 1);
    for (let i = 0; i <= steps; i++) {
      const ST = S * Math.pow(u, steps - i) * Math.pow(dn, i);
      v[i] = Math.max(call ? ST - K : K - ST, 0);
    }
    for (let n = steps - 1; n >= 0; n--) {
      for (let i = 0; i <= n; i++) {
        let cont = disc * (p * v[i] + (1 - p) * v[i + 1]);
        if (american) {
          const ST = S * Math.pow(u, n - i) * Math.pow(dn, i);
          cont = Math.max(cont, call ? ST - K : K - ST);
        }
        v[i] = cont;
      }
    }
    return v[0];
  }

  // Monte Carlo price with standard errors at nested checkpoints, for three estimators.
  // method: "plain" | "antithetic" | "control"
  function monteCarlo({ S, K, T, sigma, r, call }, N, method, seed) {
    const rnorm = normalSampler(mulberry32(seed));
    const drift = (r - 0.5 * sigma * sigma) * T,
      vol = sigma * Math.sqrt(T),
      disc = Math.exp(-r * T);
    const payoff = (z) => {
      const ST = S * Math.exp(drift + vol * z);
      return [disc * Math.max(call ? ST - K : K - ST, 0), ST];
    };
    const EST = S * Math.exp(r * T); // known mean of the control variate
    const checkpoints = [];
    for (let c = 100; c < N; c = Math.ceil(c * 1.25)) checkpoints.push(c);
    if (checkpoints[checkpoints.length - 1] !== N) checkpoints.push(N);
    const out = [];
    let ci = 0,
      m = 0; // m = number of samples Y accumulated
    let sy = 0,
      syy = 0,
      sx = 0,
      sxx = 0,
      sxy = 0;
    const target = (n) => (method === "antithetic" ? n / 2 : n); // antithetic: one Y per pair of paths
    for (let paths = 0; paths < N;) {
      let y, x;
      if (method === "antithetic") {
        const z = rnorm();
        const [f1, s1] = payoff(z),
          [f2, s2] = payoff(-z);
        y = 0.5 * (f1 + f2);
        x = 0.5 * (s1 + s2);
        paths += 2;
      } else {
        const [f, s] = payoff(rnorm());
        y = f;
        x = s;
        paths += 1;
      }
      m++;
      sy += y;
      syy += y * y;
      sx += x;
      sxx += x * x;
      sxy += x * y;
      while (ci < checkpoints.length && paths >= checkpoints[ci]) {
        const my = sy / m,
          vy = (syy - m * my * my) / (m - 1);
        let est = my,
          varY = vy;
        if (method === "control") {
          const mx = sx / m,
            vx = (sxx - m * mx * mx) / (m - 1),
            cxy = (sxy - m * mx * my) / (m - 1);
          const c = vx > 0 ? cxy / vx : 0;
          est = my - c * (mx - EST);
          varY = Math.max(vy - (cxy * cxy) / vx, 0);
        }
        out.push({ paths: checkpoints[ci], estimate: est, se: Math.sqrt(varY / m), sdPerPath: Math.sqrt(varY * (method === "antithetic" ? 2 : 1)) });
        ci++;
      }
    }
    return out;
  }

  const PATHS = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
  const NAMES = { plain: "plain", antithetic: "antithetic", control: "control-variate" };
  const NS = "http://www.w3.org/2000/svg";
  const q = (sel) => root.querySelector(sel);
  const inputs = { S: q("#od-spot"), K: q("#od-strike"), T: q("#od-years"), sigma: q("#od-vol"), r: q("#od-rate"), paths: q("#od-paths") };
  const chart = q(".od-chart"),
    readout = q(".od-readout");
  let seed = 271828,
    frame = 0;

  const checked = (name) => root.querySelector('input[name="' + name + '"]:checked').value;
  const f4 = (x) => x.toFixed(4);
  const count = (n) => Math.round(n).toLocaleString("en-US");
  function params() {
    return {
      S: Number(inputs.S.value),
      K: Number(inputs.K.value),
      T: Number(inputs.T.value),
      sigma: Number(inputs.sigma.value) / 100,
      r: Number(inputs.r.value) / 100,
      call: checked("od-type") === "call",
    };
  }
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }
  Object.values(inputs).forEach((input) => input.addEventListener("input", schedule));
  root.querySelectorAll('input[name="od-type"], input[name="od-method"]').forEach((input) => input.addEventListener("change", schedule));
  q(".od-reseed").addEventListener("click", () => {
    seed = Math.floor(Math.random() * 1e9);
    schedule();
  });

  function el(name, attrs, text) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function niceStep(range) {
    const raw = range / 5,
      p = Math.pow(10, Math.floor(Math.log10(raw))),
      m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }

  function drawChart(truth, plain, sel, method) {
    const W = Math.max(300, Math.min(760, Math.round(chart.clientWidth || 640)));
    const H = Math.round(W * (W < 520 ? 0.8 : 0.5));
    const m = { l: W < 520 ? 46 : 56, r: 28, t: 14, b: 44 };
    const series = method === "plain" ? [sel] : [plain, sel];
    const minPaths = Math.min(400, sel[sel.length - 1].paths / 4);
    let lo = truth,
      hi = truth;
    for (const s of series)
      for (const p of s) {
        if (p.paths < minPaths) continue;
        lo = Math.min(lo, p.estimate - 1.96 * p.se);
        hi = Math.max(hi, p.estimate + 1.96 * p.se);
      }
    const pad = Math.max((hi - lo) * 0.08, 1e-3);
    lo -= pad;
    hi += pad;
    const x0 = Math.log10(100),
      x1 = Math.log10(sel[sel.length - 1].paths);
    const x = (n) => m.l + ((Math.log10(n) - x0) / (x1 - x0)) * (W - m.l - m.r);
    const y = (v) => m.t + ((hi - v) / (hi - lo)) * (H - m.t - m.b);
    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", class: "od-svg" });
    svg.appendChild(el("title", {}, "Monte Carlo estimate with 95% interval against the Black-Scholes price"));

    const defs = el("defs", {});

    const clip = el("clipPath", { id: "od-clip" });

    clip.appendChild(el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b }));

    defs.appendChild(clip);

    svg.appendChild(defs);

    const step = niceStep(hi - lo),
      decimals = Math.max(0, -Math.floor(Math.log10(step)));
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: "od-grid" }));
      svg.appendChild(el("text", { x: m.l - 6, y: y(v) + 4, class: "od-tick", "text-anchor": "end" }, v.toFixed(decimals)));
    }
    for (const n of [100, 1000, 10000, 100000]) {
      if (n > sel[sel.length - 1].paths) break;
      svg.appendChild(el("text", { x: x(n), y: H - m.b + 16, class: "od-tick", "text-anchor": "middle" }, count(n)));
    }
    svg.appendChild(el("text", { x: (m.l + W - m.r) / 2, y: H - 6, class: "od-axis", "text-anchor": "middle" }, "Number of simulated paths"));
    svg.appendChild(
      el(
        "text",
        { x: 0, y: 0, class: "od-axis", "text-anchor": "middle", transform: "translate(12," + (m.t + (H - m.t - m.b) / 2) + ") rotate(-90)" },
        "Option price"
      )
    );

    const band = (s) =>
      s
        .map((p) => x(p.paths).toFixed(1) + "," + y(p.estimate + 1.96 * p.se).toFixed(1))
        .concat(
          s
            .slice()
            .reverse()
            .map((p) => x(p.paths).toFixed(1) + "," + y(p.estimate - 1.96 * p.se).toFixed(1))
        )
        .join(" ");
    if (method !== "plain") svg.appendChild(el("polygon", { points: band(plain), class: "od-band-plain", "clip-path": "url(#od-clip)" }));
    svg.appendChild(el("polygon", { points: band(sel), class: "od-band", "clip-path": "url(#od-clip)" }));
    svg.appendChild(
      el("polyline", {
        points: sel.map((p) => x(p.paths).toFixed(1) + "," + y(p.estimate).toFixed(1)).join(" "),
        class: "od-est",
        "clip-path": "url(#od-clip)",
      })
    );
    svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: y(truth), y2: y(truth), class: "od-truth" }));
    svg.appendChild(el("text", { x: W - m.r - 4, y: y(truth) - 7, class: "od-truth-label", "text-anchor": "end" }, "Black–Scholes price"));
    if (method !== "plain") svg.appendChild(el("text", { x: m.l + 8, y: m.t + 14, class: "od-plain-label" }, "grey: plain Monte Carlo"));
    chart.replaceChildren(svg);
    const last = sel[sel.length - 1];
    svg.setAttribute(
      "aria-label",
      "With " +
        count(last.paths) +
        " paths the estimate is " +
        f4(last.estimate) +
        " plus or minus " +
        f4(1.96 * last.se) +
        "; Black-Scholes gives " +
        f4(truth) +
        "."
    );
  }

  function update() {
    const p = params(),
      N = PATHS[Number(inputs.paths.value)],
      method = checked("od-method");
    q("#od-spot-out").textContent = p.S.toFixed(0);
    q("#od-strike-out").textContent = p.K.toFixed(0);
    q("#od-years-out").textContent = p.T.toFixed(2);
    q("#od-vol-out").textContent = (p.sigma * 100).toFixed(0) + "%";
    q("#od-rate-out").textContent = (p.r * 100).toFixed(2) + "%";
    q("#od-paths-out").textContent = count(N);

    const bs = blackScholes(p);
    const plain = monteCarlo(p, N, "plain", seed);
    const sel = method === "plain" ? plain : monteCarlo(p, N, method, seed);
    const last = sel[sel.length - 1],
      lastPlain = plain[plain.length - 1];
    const american = binomial(p, 400, true),
      europeanTree = binomial(p, 400, false);
    drawChart(bs.price, plain, sel, method);

    q(".od-bs").textContent = f4(bs.price);
    q(".od-mc").textContent = f4(last.estimate) + " ± " + f4(1.96 * last.se);
    q(".od-am").textContent =
      f4(american) + (p.call ? " (same as European: no dividends)" : " (early exercise adds " + (american - europeanTree).toFixed(3) + ")");
    q(".od-greeks").textContent = "delta " + bs.delta.toFixed(3) + ", vega " + bs.vega.toFixed(3) + " per vol point";

    let text =
      "With " +
      count(N) +
      " paths the " +
      NAMES[method] +
      " estimate is " +
      f4(last.estimate) +
      " ± " +
      f4(1.96 * last.se) +
      ", and Black–Scholes gives " +
      f4(bs.price) +
      ".";
    if (method === "plain") text += " Halving that error bar would take four times as many paths.";
    else if (last.sdPerPath > 0) {
      const ratio = Math.pow(lastPlain.sdPerPath / last.sdPerPath, 2);
      text +=
        ratio >= 1.05
          ? " For the same precision, plain Monte Carlo would need " + ratio.toFixed(1) + " times as many paths."
          : " Here it barely beats plain Monte Carlo: deep in or out of the money, the payoff tracks the stock price less closely.";
    }
    readout.textContent = text;
  }

  if (typeof ResizeObserver !== "undefined") new ResizeObserver(schedule).observe(chart);
  update();
})();
