---
layout: page
title: Forecasts scored in public
description: Daily intervals for the 10-year Treasury yield and EUR/USD, published before the fact and scored after.
img: assets/img/projects/forecast-scoreboard.png
importance: 3
category: Interactive
---

{% include demo-styles.liquid %}

Every business day, two models forecast the next day's change in the 10-year Treasury yield and in EUR/USD, as full predictive distributions, before the change is known. Once the value is published, each forecast is scored. Nothing is backfilled: a day that couldn't be forecast in time is recorded as a skip, not forecast late.

One model is Bayesian stochastic volatility, refit by MCMC each day, whose intervals carry the uncertainty about the parameters and about the latent volatility. The other is a GARCH(1,1) with Student-t errors, whose intervals plug in point estimates. The scoreboard asks whether the Bayesian treatment of uncertainty buys better calibration out of sample.

<div id="scoreboard" class="demo" data-src="https://raw.githubusercontent.com/GiorgioMB/forecast-scoreboard/main/site/scoreboard.json">
  <div class="controls">
    <fieldset>
      <legend>Series</legend>
      <div class="seg">
        <input type="radio" id="sb-ust10y" name="sb-series" value="ust10y" checked><label for="sb-ust10y">10-year Treasury yield</label>
        <input type="radio" id="sb-eurusd" name="sb-series" value="eurusd"><label for="sb-eurusd">EUR/USD</label>
      </div>
    </fieldset>
    <fieldset>
      <legend>Intervals shown</legend>
      <div class="seg">
        <input type="radio" id="sb-sv" name="sb-model" value="sv" checked><label for="sb-sv">Bayesian SV</label>
        <input type="radio" id="sb-garch" name="sb-model" value="garch"><label for="sb-garch">GARCH, plug-in</label>
      </div>
    </fieldset>
  </div>
  <div class="sb-open"></div>
  <div class="chart sb-chart"></div>
  <p class="sb-hover"></p>
  <div class="sb-table"></div>
  <p class="readout sb-diff"></p>
  <p class="status sb-status">Loading the scoreboard…</p>
</div>
<script src="{{ '/assets/js/scoreboard-demo.js' | relative_url }}"></script>

### Reading the scores

In the chart, the bands are the 80% and 95% intervals issued the day before, and the dots are the changes that followed; a ring is a change outside the 95% interval. An interval's coverage is the share of days on which the change fell inside it. It should be close to 80% or 95%, and the range after each figure is a 95% Wilson interval for it. The mean log score rewards a forecast for putting high probability where the change landed, and it can separate two models whose coverage is the same. The PIT histogram should be flat: a U shape means intervals that are too narrow, a hump means intervals that are too wide.

### The rules

The Treasury's value for a day is set from quotes taken at or near 3:30 PM ET, the ECB's at around 14:10 CET. A forecast is issued only while the next value is at least an hour from being set, and that is checked again after fitting, before anything is published. Values are scored as first published, and each forecast stores its full predictive distribution, so anyone can rescore it. The code, the record, and an outside timestamp of every forecast are in the [forecast-scoreboard](https://github.com/GiorgioMB/forecast-scoreboard) repository.

Data from the U.S. Department of the Treasury and the European Central Bank, whose reference rates are available free of charge from the ECB. This is a statistics project, not investment advice.
