# Validation Report — v1.6.0

## Automated checks
- `app.js` syntax
- `sw.js` syntax
- manifest JSON
- GitHub Pages workflow present
- iOS push open transform present
- iOS push close transform present
- route-active background state present
- modal backdrop transparent
- responsive result layout present
- long filename wrapping present
- download button class present
- result scrollIntoView present

## Runtime boundary
This environment does not emulate an actual iPhone Safari navigation animation. Static validation confirms the transition and responsive layout code paths exist and parse successfully.

## Recommended device tests
1. 390px portrait: process a PDF with a very long filename; Download must remain visible.
2. 500px browser width: Download/Share must stay inside viewport.
3. Tap tool: route must slide from right to left.
4. Tap `<`: route must slide to the right.
5. Rapid open/back taps must not leave a dark modal backdrop.
6. Dark Mode and Reduce Motion.

## Build results

- PASS — app.js syntax
- PASS — sw.js syntax
- PASS — asset styles.css
- PASS — asset app.js
- PASS — asset manifest.webmanifest
- PASS — asset icons/icon-192.png
- PASS — asset .github/workflows/pages.yml
- PASS — v1.6 marker
- PASS — push open
- PASS — push close
- PASS — route active
- PASS — result scroll
- PASS — result download markup
- PASS — transparent tool backdrop
- PASS — mobile result grid
- PASS — long filename wrap
- PASS — iOS grouped background
- PASS — glass navigation only marker
