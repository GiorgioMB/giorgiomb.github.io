// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-publications",
          title: "publications",
          description: "Preprints and papers, newest first.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-projects",
          title: "projects",
          description: "Some of these are interactive and run in your browser.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "The PDF has the most recent version.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "news-posted-bridge-sampling-diagnostics-my-first-preprint-with-aki-vehtari",
          title: 'Posted Bridge Sampling Diagnostics, my first preprint, with Aki Vehtari.',
          description: "",
          section: "News",},{id: "news-started-my-phd-in-statistics-at-the-university-of-chicago",
          title: 'Started my PhD in Statistics at the University of Chicago.',
          description: "",
          section: "News",},{id: "news-posted-edgewise-envelopes-between-balanced-forman-and-ollivier-ricci-curvature-with-tebe-nigrelli",
          title: 'Posted Edgewise Envelopes Between Balanced Forman and Ollivier-Ricci Curvature with Tebe Nigrelli.',
          description: "",
          section: "News",},{id: "news-reached-the-semifinal-of-the-ey-ai-amp-amp-data-challenge-in-the-top-10-of-953-teams-competing-solo-project-page",
          title: 'Reached the semifinal of the EY AI &amp;amp;amp; Data Challenge, in the top...',
          description: "",
          section: "News",},{id: "news-posted-the-revised-bridge-sampling-diagnostics-with-a-new-hybrid-proposal-that-keeps-the-error-estimate-reliable-in-higher-dimensions-try-the-demo",
          title: 'Posted the revised Bridge Sampling Diagnostics, with a new hybrid proposal that keeps...',
          description: "",
          section: "News",},{id: "news-scalable-graph-curvature-was-accepted-at-the-neurips-2026-workshop-on-graph-distributional-deep-learning",
          title: 'Scalable Graph Curvature was accepted at the NeurIPS 2026 Workshop on Graph Distributional...',
          description: "",
          section: "News",},{id: "news-posted-overlap-not-moments-finite-sample-theory-for-bridge-sampling-my-first-solo-paper",
          title: 'Posted Overlap, Not Moments: Finite-Sample Theory for Bridge Sampling, my first solo paper....',
          description: "",
          section: "News",},{id: "projects-when-an-error-bar-can-39-t-warn-you",
          title: 'When an error bar can&amp;#39;t warn you',
          description: "Bridge sampling&#39;s error estimate has a ceiling. Watch it hit it.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/bridge-sampling/";
            },},{id: "projects-water-quality-from-coordinates",
          title: 'Water quality from coordinates',
          description: "EY AI &amp; Data Challenge 2026, top 10 of 953 teams, competing solo.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/ey-water-quality/";
            },},{id: "projects-option-prices-with-honest-error-bars",
          title: 'Option prices with honest error bars',
          description: "Monte Carlo pricing in your browser, checked against Black–Scholes.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/option-pricing/";
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
        id: 'social-cv',
        title: 'CV',
        section: 'Socials',
        handler: () => {
          window.open("/assets/pdf/Giorgio_Micaletto_CV.pdf", "_blank");
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
