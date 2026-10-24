// Runs the bridge sampling sweep off the main thread for /projects/bridge-sampling/.
importScripts("bridge-core.js");

self.onmessage = function (event) {
  const { S, proposal, grid, reps, seed } = event.data;
  const rows = [];
  for (const d of grid) {
    let squaredError = 0,
      mcseSum = 0,
      ok = 0,
      fails = 0;
    for (let r = 0; r < reps; r++) {
      const res = bridgeRun(d, S, proposal, seed + 7919 * d + 31 * r);
      if (res.failed) {
        fails++;
        continue;
      }
      squaredError += res.error * res.error;
      mcseSum += res.mcse;
      ok++;
    }
    rows.push({ d, rmse: ok ? Math.sqrt(squaredError / ok) : NaN, mcse: ok ? mcseSum / ok : NaN, fails });
    self.postMessage({ type: "progress", rows: rows.slice() });
  }
  self.postMessage({ type: "done", rows });
};
