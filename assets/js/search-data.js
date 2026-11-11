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
        },{id: "news-scalable-graph-curvature-was-accepted-at-the-neurips-2026-workshop-on-geometric-distributional-deep-learning",
          title: 'Scalable Graph Curvature was accepted at the NeurIPS 2026 Workshop on Geometric Distributional...',
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
            },},{id: "projects-forecasts-scored-in-public",
          title: 'Forecasts scored in public',
          description: "Daily intervals for the 10-year Treasury yield and EUR/USD, published before the fact and scored after.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/forecast-scoreboard/";
            },},{id: "projects-option-prices-with-honest-error-bars",
          title: 'Option prices with honest error bars',
          description: "Monte Carlo pricing in your browser, checked against Black–Scholes.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/option-pricing/";
            },},{id: "projects-which-edges-need-optimal-transport",
          title: 'Which edges need optimal transport?',
          description: "Cheap bounds certify the sign of many edges&#39; Ollivier–Ricci curvature. See which ones still need a transport problem.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/screening-map/";
            },},{id: "projects-sporf-on-current-python",
          title: 'SPORF on current Python',
          description: "A maintained fork of sparse projection oblique randomer forests, proposed upstream in neurodata/SPORF#361.",
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
