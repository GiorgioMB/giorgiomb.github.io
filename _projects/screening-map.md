---
layout: page
title: Which edges need optimal transport?
description: Cheap bounds certify the sign of many edges' Ollivier–Ricci curvature. See which ones still need a transport problem.
img: assets/img/projects/screening-map.png
importance: 2
category: Interactive
---

{% include demo-styles.liquid %}

Ollivier–Ricci (OR) curvature compares the neighbourhoods of an edge's two endpoints by solving an optimal transport problem, one per edge. Balanced Forman (BF) curvature is a cheap combinatorial stand-in. In [From Proxy to Certificate](https://arxiv.org/abs/2603.13535v6), Tebe Nigrelli and I show that the BF value of an edge certifies an interval for its lazy OR curvature without solving any transport problem, and that the edge's 2-hop neighbourhood sharpens it.

To decide whether $\kappa_{\mathrm{OR}} < \tau$ for every edge, certify-then-solve computes the 2-hop interval, which settles every edge the BF interval settles and more, intersects it with a certificate from the bounds of Tian, Lubberts and Weber (TLW), and solves a transport problem only for the edges still undecided. The map shows this one stage at a time, as the paper's figure does: (a) what the BF interval alone decides, (b) the 2-hop interval, (c) the TLW certificate, and (d) the transport problems that remain. Each stage draws the edges it decides in colour and the edges decided earlier in grey; edges still undecided aren't drawn.

<div id="screening-map" class="demo" data-src="{{ '/assets/json/screening-map/' | relative_url }}">
  <div class="controls">
    <fieldset>
      <legend>Graph</legend>
      <div class="seg">
        <input type="radio" id="sm-rgg" name="sm-graph" value="rgg" checked><label for="sm-rgg">Random geometric</label>
        <input type="radio" id="sm-yeast" name="sm-graph" value="yeast"><label for="sm-yeast">Yeast</label>
        <input type="radio" id="sm-karate" name="sm-graph" value="karate"><label for="sm-karate">Karate club</label>
      </div>
    </fieldset>
    <fieldset class="sm-rgg-only">
      <legend>Expected degree</legend>
      <div class="seg">
        <input type="radio" id="sm-d6" name="sm-degree" value="6"><label for="sm-d6">6</label>
        <input type="radio" id="sm-d8" name="sm-degree" value="8" checked><label for="sm-d8">8</label>
        <input type="radio" id="sm-d12" name="sm-degree" value="12"><label for="sm-d12">12</label>
      </div>
    </fieldset>
    <button type="button" class="action sm-rgg-only sm-another">Draw another graph</button>
  </div>
  <div class="sm-threshold">
    <label for="sm-tau">Threshold τ <output class="sm-tau-value" for="sm-tau">0.00</output></label>
    <button type="button" class="action sm-tau-reset">Back to τ = 0</button>
    <input type="range" id="sm-tau" class="sm-tau-input" min="-100" max="100" step="1" value="0">
  </div>
  <div class="chart sm-chart"></div>
  <fieldset class="sm-steps">
    <legend class="sr-only">Stage</legend>
    <input type="radio" id="sm-s0" name="sm-stage" value="0" checked><label for="sm-s0"><span class="sm-swatch sm-swatch-0"></span><span class="sm-step-name">(a) BF interval</span><span class="sm-step-num"></span></label>
    <input type="radio" id="sm-s1" name="sm-stage" value="1"><label for="sm-s1"><span class="sm-swatch sm-swatch-1"></span><span class="sm-step-name">(b) 2-hop interval</span><span class="sm-step-num"></span></label>
    <input type="radio" id="sm-s2" name="sm-stage" value="2"><label for="sm-s2"><span class="sm-swatch sm-swatch-2"></span><span class="sm-step-name">(c) + TLW certificate</span><span class="sm-step-num"></span></label>
    <input type="radio" id="sm-s3" name="sm-stage" value="3"><label for="sm-s3"><span class="sm-swatch sm-swatch-3"></span><span class="sm-step-name">(d) + exact solver</span><span class="sm-step-num"></span></label>
  </fieldset>
  <div class="sm-map"></div>
  <p class="sm-legend">
    <span class="sm-key sm-key-neg">decided here, κ<sub>OR</sub> &lt; τ</span>
    <span class="sm-key sm-key-pos">decided here, κ<sub>OR</sub> ≥ τ</span>
    <span class="sm-key sm-key-old">decided by an earlier stage</span>
    <span>undecided: not drawn</span>
  </p>
  <div class="readout sm-readout"></div>
  <p class="sr-only sm-live" aria-live="polite"></p>
  <p class="status sm-status"></p>
</div>
<script src="{{ '/assets/js/screening-core.js' | relative_url }}"></script>
<script src="{{ '/assets/js/screening-demo.js' | relative_url }}"></script>

### What you're seeing

On the paper's graph at $\tau = 0$, the sign query, the BF interval alone decides 52.8% of the edges, the 2-hop interval brings that to 63.4% and the TLW certificate to 73.8%, so 781 of the 2,985 edges need a transport problem. Almost everything the BF interval decides has $\kappa_{\mathrm{OR}} \geq 0$, and almost everything the 2-hop interval and the TLW certificate add has $\kappa_{\mathrm{OR}} < 0$.

Moving $\tau$ changes which edges sit close to the threshold, and so which ones are hard. The chart shows, for every $\tau$ from −1 to 1, how the edges split between the four stages; the vertical line marks the current $\tau$, and dragging along the chart moves it. Denser graphs leave more to the solver: at $\tau = 0$, the random geometric graphs of expected degree 6 send between 19% and 22% of their edges to it, those of degree 12 between 28% and 33%.

As in the paper's code, every interval is widened by $10^{-9}$ against floating-point rounding before it is compared with $\tau$, so an interval whose lower end is exactly $\tau$ doesn't decide its edge. That is the spike in the chart at $\tau = 0$: on the paper's graph, 92 of the 781 transport problems at $\tau = 0$ are edges whose lower end is exactly 0.

### How it's computed

Every interval and curvature comes from the paper's code, [Curvature-Transfer-Code](https://github.com/GiorgioMB/Curvature-Transfer-Code), with the exact values from [orcut](https://github.com/GiorgioMB/orcut), the solver behind every exact value in the paper.

The random geometric graphs have 800 uniform points in the unit square, joined when closer than $r$, with the expected degree $800 \pi r^2$ set to 6, 8 or 12; each is restricted to its largest component and drawn at its points. Seed 0 at degree 8 is the graph of the paper's figure, and "Draw another graph" steps through three more seeds. Yeast and the karate club are two of the paper's real networks, drawn with a Kamada–Kawai layout.
