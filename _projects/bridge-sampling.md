---
layout: page
title: When an error bar can't warn you
description: Bridge sampling's error estimate has a ceiling. Watch it hit it.
img: assets/img/projects/bridge-sampling.png
importance: 1
category: interactive
---

{% include demo-styles.liquid %}

Bridge sampling estimates the marginal likelihood of a Bayesian model, and reports a Monte Carlo standard error (MCSE) alongside the estimate. In [Bridge Sampling Diagnostics](https://arxiv.org/abs/2508.14487), Aki Vehtari and I show that this error estimate has a ceiling: however badly the estimate fails, the MCSE can't exceed $\sqrt{\log 3} \approx 1.05$.

The figure runs bridge sampling on a Gaussian posterior whose answer is known, so you can compare what the MCSE reports with how far off the estimate really is. Each point averages 20 runs.

<div id="bridge-demo" class="demo" data-worker="{{ '/assets/js/bridge-worker.js' | relative_url }}">
  <div class="controls">
    <fieldset>
      <legend>Proposal</legend>
      <div class="seg">
        <input type="radio" id="bd-sample" name="bd-proposal" value="sample" checked><label for="bd-sample">Standard</label>
        <input type="radio" id="bd-hybrid" name="bd-proposal" value="hybrid"><label for="bd-hybrid">Hybrid</label>
      </div>
    </fieldset>
    <fieldset>
      <legend>Draws per run</legend>
      <div class="seg">
        <input type="radio" id="bd-500" name="bd-draws" value="500" checked><label for="bd-500">500</label>
        <input type="radio" id="bd-1000" name="bd-draws" value="1000"><label for="bd-1000">1,000</label>
        <input type="radio" id="bd-2000" name="bd-draws" value="2000"><label for="bd-2000">2,000</label>
      </div>
    </fieldset>
    <button type="button" class="action bd-run">Run again with new draws</button>
  </div>
  <div class="chart bd-chart"></div>
  <p class="readout bd-readout" aria-live="polite"></p>
  <p class="status bd-status"></p>
</div>
<script src="{{ '/assets/js/bridge-demo.js' | relative_url }}"></script>

### What you're seeing

With the standard proposal, a Gaussian fitted with the sample covariance of the draws, the two lines agree until the sample covariance gets too noisy for the dimension. Then the reported error flattens below the ceiling while the actual error keeps climbing. More draws push the breakdown further out, but slowly. The MCSE does cross 0.3 shortly before it breaks down, which is why the paper recommends trusting it only below that.

The hybrid proposal combines the sample covariance with the inverse covariance of the posterior's gradients, taking their midpoint in the affine-invariant geometry of covariance matrices. For a Gaussian posterior that midpoint is exactly the true covariance, which is why its lines stay low and together here. Real posteriors aren't Gaussian, but across the 41 posteriors in the paper the hybrid proposal kept the actual error within a factor of 1.4 of the reported one.

### How it's computed

The posterior is $\mathcal{N}(0, \Sigma)$ with variances spread from 0.1 to 10 and its normalising constant dropped, as a probabilistic programming language would report it. Each run draws independent samples, fits the proposal on half of them, and uses the other half, plus as many proposal draws, for the estimate. The estimator uses the optimal bridge function, starts from the median log ratio as the [bridgesampling](https://github.com/quentingronau/bridgesampling) R package does, and computes the MCSE with the formula from the paper. Everything runs in your browser.

The code for the paper's experiments is [on GitHub](https://github.com/GiorgioMB/bridgesampling_paper_code), and [Overlap, Not Moments](https://arxiv.org/abs/2610.17403) gives finite-sample theory for when the estimate and its MCSE can be trusted.
