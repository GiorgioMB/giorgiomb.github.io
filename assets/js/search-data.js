// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "About",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-publications",
          title: "Publications",
          description: "Preprints and papers, newest first.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-projects",
          title: "Projects",
          description: "Some of these are interactive and run in your browser.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "news-scalable-graph-curvature-was-accepted-at-the-neurips-2026-workshop-bridging-optimal-transport-learning-and-structured-data-toward-geometric-distributional-learning-held-in-paris",
          title: 'Scalable Graph Curvature was accepted at the NeurIPS 2026 workshop Bridging Optimal Transport,...',
          description: "",
          section: "News",},{id: "projects-saturation-of-the-bridge-sampling-error-estimate",
          title: 'Saturation of the bridge sampling error estimate',
          description: "Reported versus actual error of bridge sampling on a Gaussian posterior with known normalising constant. The reported Monte Carlo standard error cannot exceed √(log 3) ≈ 1.05, however large the actual error.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/bridge-sampling/";
            },},{id: "projects-water-quality-prediction-from-location-and-date",
          title: 'Water quality prediction from location and date',
          description: "Predicting three water quality indicators at South African monitoring stations from coordinates and sampling date alone. Solo entry in the EY AI &amp; Data Challenge 2026, reaching the semifinal (top 10 of 953 teams).",
          section: "Projects",handler: () => {
              window.location.href = "/projects/ey-water-quality/";
            },},{id: "projects-variance-reduction-for-monte-carlo-option-pricing",
          title: 'Variance reduction for Monte Carlo option pricing',
          description: "European option prices by simulation, compared against Black–Scholes, with plain, antithetic and control-variate estimators. At the default parameters, the control variate narrows the 95% interval by a factor of 2.4, equivalent to about six times as many paths.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/option-pricing/";
            },},{id: "projects-certifying-ollivier-ricci-curvature-signs",
          title: 'Certifying Ollivier–Ricci curvature signs',
          description: "Stage-by-stage certification of curvature signs from combinatorial bounds. On the paper&#39;s random geometric graph, 73.8% of edges are decided without solving an optimal transport problem.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/screening-map/";
            },},{id: "projects-sporf-on-current-python",
          title: 'SPORF on current Python',
          description: "A maintained fork of sparse projection oblique randomer forests that installs on Python 3.8 to 3.14, proposed upstream in neurodata/SPORF#361.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/sporf/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%67%6D%69%63%61%6C%65%74%74%6F@%75%63%68%69%63%61%67%6F.%65%64%75", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=Wlw7t8wAAAAJ", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/GiorgioMB", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/giorgio-micaletto", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
