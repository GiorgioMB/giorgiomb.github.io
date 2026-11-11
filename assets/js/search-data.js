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
          section: "News",},{id: "projects-when-an-error-bar-can-39-t-warn-you",
          title: 'When an error bar can&amp;#39;t warn you',
          description: "However wrong the estimate, bridge sampling&#39;s error estimate can&#39;t exceed √(log 3) ≈ 1.05. Watch it hit the ceiling.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/bridge-sampling/";
            },},{id: "projects-water-quality-from-coordinates",
          title: 'Water quality from coordinates',
          description: "EY AI &amp; Data Challenge 2026, top 10 of 953 teams, competing solo.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/ey-water-quality/";
            },},{id: "projects-option-prices-with-honest-error-bars",
          title: 'Option prices with honest error bars',
          description: "Monte Carlo pricing in your browser, checked against Black–Scholes. At the defaults, a control variate narrows the 95% band 2.4×, worth six times the paths.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/option-pricing/";
            },},{id: "projects-which-edges-need-optimal-transport",
          title: 'Which edges need optimal transport?',
          description: "Cheap bounds certify the Ollivier–Ricci curvature sign of 73.8% of edges on the paper&#39;s graph. See which 781 still need optimal transport.",
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
