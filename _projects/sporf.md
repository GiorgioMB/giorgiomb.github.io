---
layout: page
title: SPORF on current Python
description: A maintained fork of sparse projection oblique randomer forests, proposed upstream in neurodata/SPORF#361.
img: assets/img/projects/sporf.png
importance: 1
category: Open source
---

[SPORF](https://github.com/neurodata/SPORF), short for sparse projection oblique randomer forests ([Tomita et al.](https://arxiv.org/abs/1506.03410)), is a random forest that splits on sparse random linear combinations of features rather than on one feature at a time. Its Python package no longer builds on recent versions of Python and pip. My [fork](https://github.com/GiorgioMB/SPORF_Available/tree/staging) makes it work again:

- restores the unsupervised forests (URF and URerF), and fixes a data race in the C++ code that updates their similarity matrix;
- removes an unused Eigen dependency and modernizes the build, so the package installs with current pip on Python 3.8 to 3.14;
- makes scikit-learn 1.6 and later recognize the classifier, and updates the tests for current scikit-learn;
- makes the unsupervised forests respect `random_state`, and adds continuous integration.

These changes are proposed upstream in [neurodata/SPORF#361](https://github.com/neurodata/SPORF/pull/361), which is awaiting review.
