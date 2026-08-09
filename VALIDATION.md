# Validation Report — v1.7.0

## Automated checks

- JavaScript syntax
- Service worker syntax
- manifest JSON
- GitHub Pages workflow
- compact title DOM
- large title DOM
- title scroll synchronization
- bottom search DOM/CSS
- no install button in HTML
- no theme button in HTML
- theme toggle DOM/JS
- PayMe row
- PayPal row
- donation configuration
- back button focus suppression
- tool-route search hiding

## Runtime boundary

The large-title threshold and iPhone Safari toolbar/safe-area appearance should still be verified on a real iPhone because Safari's visible viewport changes as its own browser chrome expands and collapses.

## Build check results

- PASS — app.js syntax
- PASS — sw.js syntax
- PASS — manifest JSON
- PASS — asset styles.css
- PASS — asset app.js
- PASS — asset manifest.webmanifest
- PASS — asset .github/workflows/pages.yml
- PASS — asset icons/icon-192.png
- PASS — version marker
- PASS — compact title DOM
- PASS — large title DOM
- PASS — large title sync
- PASS — bottom search DOM
- PASS — bottom search CSS
- PASS — theme toggle
- PASS — theme toggle handler
- PASS — PayMe row
- PASS — PayPal row
- PASS — donation config
- PASS — back focus suppression
- PASS — back blur
- PASS — search hides on tool
- PASS — no install button HTML
- PASS — no theme button HTML
- PASS — no top plus button HTML
