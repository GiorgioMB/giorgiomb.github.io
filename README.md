# giorgiomb.github.io

The website of Giorgio Micaletto, PhD student in Statistics at the University of Chicago.

## How it is built

The pages are plain HTML. The home, publications, projects and 404 pages are in `_pages/`, the
project pages in `_projects/` with their layout in `_layouts/treatise.liquid`, and the shared type,
styles and scripts in `assets/treatise/`. The three interactive demos keep their scripts in
`assets/js/` and the screening map its data in `assets/json/screening-map/`.

Every push to `main` is built with Jekyll and published to the `gh-pages` branch by the
"Deploy site" workflow.
