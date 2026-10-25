---
layout: page
title: Option prices with honest error bars
description: Monte Carlo pricing in your browser, checked against Black–Scholes.
img: assets/img/projects/option-pricing.png
importance: 2
category: interactive
---

{% include demo-styles.liquid %}

[stockdatamanager](https://github.com/GiorgioMB/stockdatamanipulation) is a Python library I wrote for fun as a passion project before going to Aalto, for technical, fundamental and options analysis, including Greeks and option pricing with binomial trees and Crank–Nicolson. This page is its Monte Carlo counterpart: price a European option by simulation, see how wide the error bar is, and compare it with the Black–Scholes price.

<div id="option-demo" class="demo">
  <div class="controls">
    <fieldset>
      <legend>Option</legend>
      <div class="seg">
        <input type="radio" id="od-call" name="od-type" value="call" checked><label for="od-call">Call</label>
        <input type="radio" id="od-put" name="od-type" value="put"><label for="od-put">Put</label>
      </div>
    </fieldset>
    <fieldset>
      <legend>Estimator</legend>
      <div class="seg">
        <input type="radio" id="od-plain" name="od-method" value="plain" checked><label for="od-plain">Plain</label>
        <input type="radio" id="od-anti" name="od-method" value="antithetic"><label for="od-anti">Antithetic</label>
        <input type="radio" id="od-cv" name="od-method" value="control"><label for="od-cv">Control variate</label>
      </div>
    </fieldset>
    <button type="button" class="action od-reseed">New random draws</button>
  </div>
  <div class="od-sliders">
    <div class="od-slider"><label for="od-spot">Stock price</label><output id="od-spot-out" for="od-spot"></output><input type="range" id="od-spot" min="50" max="150" step="1" value="100"></div>
    <div class="od-slider"><label for="od-strike">Strike</label><output id="od-strike-out" for="od-strike"></output><input type="range" id="od-strike" min="50" max="150" step="1" value="100"></div>
    <div class="od-slider"><label for="od-years">Years to expiry</label><output id="od-years-out" for="od-years"></output><input type="range" id="od-years" min="0.1" max="3" step="0.05" value="1"></div>
    <div class="od-slider"><label for="od-vol">Volatility</label><output id="od-vol-out" for="od-vol"></output><input type="range" id="od-vol" min="5" max="80" step="1" value="20"></div>
    <div class="od-slider"><label for="od-rate">Interest rate</label><output id="od-rate-out" for="od-rate"></output><input type="range" id="od-rate" min="0" max="10" step="0.25" value="3"></div>
    <div class="od-slider"><label for="od-paths">Simulated paths</label><output id="od-paths-out" for="od-paths"></output><input type="range" id="od-paths" min="0" max="6" step="1" value="3"></div>
  </div>
  <div class="chart od-chart"></div>
  <dl class="od-numbers">
    <div><dt>Black–Scholes</dt><dd class="od-bs"></dd></div>
    <div><dt>Monte Carlo, 95% interval</dt><dd class="od-mc"></dd></div>
    <div><dt>American, 400-step binomial tree</dt><dd class="od-am"></dd></div>
    <div><dt>Greeks</dt><dd class="od-greeks"></dd></div>
  </dl>
  <p class="readout od-readout" aria-live="polite"></p>
</div>
<script src="{{ '/assets/js/option-demo.js' | relative_url }}"></script>

### What you're seeing

The teal line is the running Monte Carlo estimate and the band is its 95% interval; the gold line is the Black–Scholes price. The band narrows like $1/\sqrt{N}$ in the number of paths $N$, so halving it takes four times as many. Variance reduction narrows it at almost no cost: antithetic draws pair each path with its mirror image, and a control variate subtracts the part of the payoff explained by the final stock price, whose mean is known. The paths stay the same as you move the sliders, so you can see how each input moves the price.

The American price comes from a 400-step binomial tree. For a put, its difference from the European price is the value of being able to exercise early.

Install the library with `pip install stockdatamanager`.
