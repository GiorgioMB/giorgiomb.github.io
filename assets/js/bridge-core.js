// Core numerics for the bridge sampling demo (no DOM). Exported for testing in Node.
"use strict";

// ---- random numbers (seeded) ----
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

// ---- symmetric eigendecomposition (Householder tridiagonalisation + QL), after JAMA ----
function symEig(Ain, n) {
  const V = Array.from({ length: n }, (_, i) => Float64Array.from(Ain[i]));
  const d = new Float64Array(n),
    e = new Float64Array(n);
  for (let j = 0; j < n; j++) d[j] = V[n - 1][j];
  for (let i = n - 1; i > 0; i--) {
    let scale = 0,
      h = 0;
    for (let k = 0; k < i; k++) scale += Math.abs(d[k]);
    if (scale === 0) {
      e[i] = d[i - 1];
      for (let j = 0; j < i; j++) {
        d[j] = V[i - 1][j];
        V[i][j] = 0;
        V[j][i] = 0;
      }
    } else {
      for (let k = 0; k < i; k++) {
        d[k] /= scale;
        h += d[k] * d[k];
      }
      let f = d[i - 1],
        g = Math.sqrt(h);
      if (f > 0) g = -g;
      e[i] = scale * g;
      h -= f * g;
      d[i - 1] = f - g;
      for (let j = 0; j < i; j++) e[j] = 0;
      for (let j = 0; j < i; j++) {
        f = d[j];
        V[j][i] = f;
        g = e[j] + V[j][j] * f;
        for (let k = j + 1; k <= i - 1; k++) {
          g += V[k][j] * d[k];
          e[k] += V[k][j] * f;
        }
        e[j] = g;
      }
      f = 0;
      for (let j = 0; j < i; j++) {
        e[j] /= h;
        f += e[j] * d[j];
      }
      const hh = f / (h + h);
      for (let j = 0; j < i; j++) e[j] -= hh * d[j];
      for (let j = 0; j < i; j++) {
        f = d[j];
        g = e[j];
        for (let k = j; k <= i - 1; k++) V[k][j] -= f * e[k] + g * d[k];
        d[j] = V[i - 1][j];
        V[i][j] = 0;
      }
    }
    d[i] = h;
  }
  for (let i = 0; i < n - 1; i++) {
    V[n - 1][i] = V[i][i];
    V[i][i] = 1;
    const h = d[i + 1];
    if (h !== 0) {
      for (let k = 0; k <= i; k++) d[k] = V[k][i + 1] / h;
      for (let j = 0; j <= i; j++) {
        let g = 0;
        for (let k = 0; k <= i; k++) g += V[k][i + 1] * V[k][j];
        for (let k = 0; k <= i; k++) V[k][j] -= g * d[k];
      }
    }
    for (let k = 0; k <= i; k++) V[k][i + 1] = 0;
  }
  for (let j = 0; j < n; j++) {
    d[j] = V[n - 1][j];
    V[n - 1][j] = 0;
  }
  V[n - 1][n - 1] = 1;
  e[0] = 0;
  // QL
  for (let i = 1; i < n; i++) e[i - 1] = e[i];
  e[n - 1] = 0;
  let f = 0,
    tst1 = 0;
  const eps = Math.pow(2, -52);
  for (let l = 0; l < n; l++) {
    tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
    let m = l;
    while (m < n) {
      if (Math.abs(e[m]) <= eps * tst1) break;
      m++;
    }
    if (m > l) {
      do {
        let g = d[l];
        let p = (d[l + 1] - g) / (2 * e[l]);
        let r = Math.hypot(p, 1);
        if (p < 0) r = -r;
        d[l] = e[l] / (p + r);
        d[l + 1] = e[l] * (p + r);
        const dl1 = d[l + 1];
        let h = g - d[l];
        for (let i = l + 2; i < n; i++) d[i] -= h;
        f += h;
        p = d[m];
        let c = 1,
          c2 = c,
          c3 = c,
          el1 = e[l + 1],
          s = 0,
          s2 = 0;
        for (let i = m - 1; i >= l; i--) {
          c3 = c2;
          c2 = c;
          s2 = s;
          g = c * e[i];
          h = c * p;
          r = Math.hypot(p, e[i]);
          e[i + 1] = s * r;
          s = e[i] / r;
          c = p / r;
          p = c * d[i] - s * g;
          d[i + 1] = h + s * (c * g + s * d[i]);
          for (let k = 0; k < n; k++) {
            h = V[k][i + 1];
            V[k][i + 1] = s * V[k][i] + c * h;
            V[k][i] = c * V[k][i] - s * h;
          }
        }
        p = (-s * s2 * c3 * el1 * e[l]) / dl1;
        e[l] = s * p;
        d[l] = c * p;
      } while (Math.abs(e[l]) > eps * tst1);
    }
    d[l] = d[l] + f;
    e[l] = 0;
  }
  return { values: d, vectors: V }; // A = V diag(d) V^T (columns of V are eigenvectors)
}

// f(A) for symmetric positive-definite A via eigendecomposition
function symFunc(A, n, fn) {
  const { values, vectors: V } = symEig(A, n);
  const fv = Array.from(values, (x) => fn(Math.max(x, 1e-12)));
  const out = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++)
    for (let j = i; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += V[i][k] * fv[k] * V[j][k];
      out[i][j] = s;
      out[j][i] = s;
    }
  return out;
}
function matMul(A, B, n) {
  const C = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    const Ai = A[i],
      Ci = C[i];
    for (let k = 0; k < n; k++) {
      const a = Ai[k];
      if (a === 0) continue;
      const Bk = B[k];
      for (let j = 0; j < n; j++) Ci[j] += a * Bk[j];
    }
  }
  return C;
}
function symmetrize(A, n) {
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const v = 0.5 * (A[i][j] + A[j][i]);
      A[i][j] = v;
      A[j][i] = v;
    }
  return A;
}
// AIRM midpoint (geometric mean) A # B
function fromEig(values, V, n, fn) {
  const fv = Array.from(values, (x) => fn(Math.max(x, 1e-12)));
  const out = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++)
    for (let j = i; j < n; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += V[i][k] * fv[k] * V[j][k];
      out[i][j] = s;
      out[j][i] = s;
    }
  return out;
}
function airmMidpoint(A, B, n) {
  const eA = symEig(A, n);
  const Ah = fromEig(eA.values, eA.vectors, n, Math.sqrt),
    Aih = fromEig(eA.values, eA.vectors, n, (x) => 1 / Math.sqrt(x));
  const M = symmetrize(matMul(matMul(Aih, B, n), Aih, n), n);
  const Mh = symFunc(M, n, Math.sqrt);
  return symmetrize(matMul(matMul(Ah, Mh, n), Ah, n), n);
}
function cholesky(A, n) {
  const L = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (s <= 0) return null;
        L[i][i] = Math.sqrt(s);
      } else L[i][j] = s / L[j][j];
    }
  }
  return L;
}
function meanCov(X, n, d) {
  const mu = new Float64Array(d);
  for (let i = 0; i < n; i++) for (let k = 0; k < d; k++) mu[k] += X[i * d + k];
  for (let k = 0; k < d; k++) mu[k] /= n;
  const C = Array.from({ length: d }, () => new Float64Array(d));
  const row = new Float64Array(d);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < d; k++) row[k] = X[i * d + k] - mu[k];
    for (let a = 0; a < d; a++) {
      const ra = row[a],
        Ca = C[a];
      for (let b = a; b < d; b++) Ca[b] += ra * row[b];
    }
  }
  for (let a = 0; a < d; a++)
    for (let b = a; b < d; b++) {
      C[a][b] /= n - 1;
      C[b][a] = C[a][b];
    }
  return { mu, C };
}

// Target: Gaussian posterior N(0, diag(lambda)) in d dimensions, log Z = 0 (normalised).
function targetVariances(d) {
  const lam = new Float64Array(d);
  for (let k = 0; k < d; k++) lam[k] = Math.exp(Math.log(0.1) + (Math.log(10) - Math.log(0.1)) * (d === 1 ? 0.5 : k / (d - 1)));
  return lam;
}

// One bridge sampling run. Returns { logZ, mcse, failed }.
function bridgeRun(d, S, proposal, seed) {
  const rand = mulberry32(seed),
    rnorm = normalSampler(rand);
  const lam = targetVariances(d);
  // Unnormalised target, as a probabilistic programming language would report it:
  // log p~(x) = -x' diag(lam)^-1 x / 2, so the true log Z is sum_k log(2 pi lam_k) / 2.
  let trueLogZ = 0;
  for (let k = 0; k < d; k++) trueLogZ += 0.5 * Math.log(2 * Math.PI * lam[k]);
  const logTarget = (x, off) => {
    let q = 0;
    for (let k = 0; k < d; k++) {
      const v = x[off + k];
      q += (v * v) / lam[k];
    }
    return -0.5 * q;
  };

  const Sfit = S / 2,
    S1 = S / 2,
    S2 = S / 2;
  const post = new Float64Array(S * d);
  for (let i = 0; i < S; i++) for (let k = 0; k < d; k++) post[i * d + k] = Math.sqrt(lam[k]) * rnorm();
  // fit proposal on the first half
  const fit = post.subarray(0, Sfit * d);
  const { mu, C } = meanCov(fit, Sfit, d);
  let Sigma = C;
  if (proposal === "hybrid") {
    // scores of the target at the fitting draws: s = -x / lambda
    const sc = new Float64Array(Sfit * d);
    for (let i = 0; i < Sfit; i++) for (let k = 0; k < d; k++) sc[i * d + k] = -fit[i * d + k] / lam[k];
    const I = meanCov(sc, Sfit, d).C; // empirical Fisher information
    const Sscore = symFunc(I, d, (x) => 1 / x); // its inverse
    Sigma = airmMidpoint(C, Sscore, d);
  }
  const L = cholesky(Sigma, d);
  if (!L) return { failed: true };
  let logDetHalf = 0;
  for (let k = 0; k < d; k++) logDetHalf += Math.log(L[k][k]);
  const y = new Float64Array(d);
  const logProposal = (x, off) => {
    for (let i = 0; i < d; i++) {
      let s = x[off + i] - mu[i];
      for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
      y[i] = s / L[i][i];
    }
    let q = 0;
    for (let i = 0; i < d; i++) q += y[i] * y[i];
    return -0.5 * q - logDetHalf - 0.5 * d * Math.log(2 * Math.PI);
  };
  // proposal draws
  const prop = new Float64Array(S2 * d),
    z = new Float64Array(d);
  for (let i = 0; i < S2; i++) {
    for (let k = 0; k < d; k++) z[k] = rnorm();
    for (let a = 0; a < d; a++) {
      let s = mu[a];
      for (let k = 0; k <= a; k++) s += L[a][k] * z[k];
      prop[i * d + a] = s;
    }
  }
  // log importance ratios
  const a = new Float64Array(S2),
    b = new Float64Array(S1);
  for (let i = 0; i < S2; i++) a[i] = logTarget(prop, i * d) - logProposal(prop, i * d);
  for (let j = 0; j < S1; j++) {
    const off = (Sfit + j) * d;
    b[j] = logTarget(post, off) - logProposal(post, off);
  }
  // fixed-point iteration on rho = log Z
  const s1 = S1 / (S1 + S2),
    s2 = S2 / (S1 + S2);
  const sortedB = Float64Array.from(b).sort();
  let rho = sortedB[Math.floor(S1 / 2)];
  const n = new Float64Array(S2),
    dd = new Float64Array(S1);
  for (let it = 0; it < 2000; it++) {
    let sn = 0,
      sd = 0;
    for (let i = 0; i < S2; i++) {
      n[i] = 1 / (s1 + s2 * Math.exp(rho - a[i]));
      sn += n[i];
    }
    for (let j = 0; j < S1; j++) {
      dd[j] = 1 / (s1 * Math.exp(b[j] - rho) + s2);
      sd += dd[j];
    }
    if (!(sn > 0) || !(sd > 0)) return { failed: true };
    const next = Math.log(sn / S2) - Math.log(sd / S1) + rho;
    if (!Number.isFinite(next)) return { failed: true };
    const done = Math.abs(next - rho) < 1e-10;
    rho = next;
    if (done) break;
  }
  // MCSE (draws are independent here, so ESS = S1)
  const relVar = (v, m) => {
    let mean = 0;
    for (let i = 0; i < m; i++) mean += v[i];
    mean /= m;
    let s = 0;
    for (let i = 0; i < m; i++) s += (v[i] - mean) ** 2;
    return s / (m - 1) / (m * mean * mean);
  };
  for (let i = 0; i < S2; i++) n[i] = 1 / (s1 + s2 * Math.exp(rho - a[i]));
  for (let j = 0; j < S1; j++) dd[j] = 1 / (s1 * Math.exp(b[j] - rho) + s2);
  const rv = relVar(n, S2) + relVar(dd, S1);
  return { logZ: rho, trueLogZ, error: rho - trueLogZ, mcse: Math.sqrt(Math.log1p(rv)), failed: false };
}

if (typeof module !== "undefined") module.exports = { bridgeRun, symEig, airmMidpoint, cholesky, mulberry32, normalSampler };
