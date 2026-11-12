---
layout: page
title: Water quality prediction from location and date
description: Predicting three water quality indicators at South African monitoring stations from coordinates and sampling date alone. Solo entry in the EY AI & Data Challenge 2026, reaching the semifinal (top 10 of 953 teams).
img: assets/img/projects/ey-water-quality.png
importance: 1
category: Competitions
---

The 2026 EY AI & Data Challenge asked for predictions of three water quality indicators, total alkalinity, electrical conductance and dissolved reactive phosphorus, at monitoring stations across South Africa, using only each sample's coordinates and date. I competed solo and reached the semifinal, in the top 10 of 953 teams.

### Approach

- **Features.** Built at each location and date from public sources: Landsat surface reflectance and spectral indices through the Microsoft Planetary Computer's STAC APIs, terrain, land cover, surface water, geology, climate and soil properties, plus auxiliary chemistry from South Africa's Department of Water and Sanitation.
- **Validation.** Spatial GroupKFold cross-validation. A nearest-neighbour encoder of nearby chemistry is refit inside each fold, so no fold sees its neighbours' targets, and adversarial validation checks for shift between training and test locations.
- **Model.** Gradient-boosted trees (XGBoost, LightGBM, CatBoost), extra trees and a per-station LSTM, combined by a ridge meta-learner fit on out-of-fold predictions and averaged over several seeds.

The code is [on GitHub](https://github.com/GiorgioMB/GradProjects/tree/main/EY%20Competition).
