# Validation Report — v1.5.0

## Automated static checks
- JavaScript syntax
- Service worker syntax
- Manifest JSON
- Local asset references
- Settings-list render markers
- Tool transition functions
- 64 KiB PDF header scan
- Unlock pre-validation exception
- QPDF MEMFS `work/input.pdf` flow
- Infile-first QPDF call ordering
- QPDF failure classifier
- Output PDF signature check

## Runtime boundary
This build environment cannot execute the CDN-hosted QPDF WebAssembly module in a real iPhone Safari session. Therefore encrypted-PDF end-to-end runtime is **not falsely marked PASS**.

The unlock path was nevertheless corrected against the browser example published by the qpdf-wasm-esm project and QPDF's documented `--decrypt` option.

## Required deployment regression
1. Correct-password encrypted PDF must produce `_unlocked.pdf`.
2. Wrong password must say password is incorrect, not "damaged".
3. A valid but unusual `.pdf` must be passed to QPDF instead of rejected at file selection.
4. Non-PDF files must remain rejected by Merge and other PDF tools.
5. Tool open/close transition must remain usable in portrait and landscape.

## Build check results

- PASS — app.js syntax
- PASS — sw.js syntax
- PASS — asset styles.css
- PASS — asset app.js
- PASS — asset manifest.webmanifest
- PASS — asset icons/icon-192.png
- PASS — asset .github/workflows/pages.yml
- PASS — v1.5 marker
- PASS — settings row renderer
- PASS — chevron
- PASS — open transition
- PASS — close transition
- PASS — reduce motion JS
- PASS — 64 KiB scan
- PASS — unlock validation exception
- PASS — qpdf working input
- PASS — qpdf infile first
- PASS — qpdf failure classifier
- PASS — output sanity
- PASS — settings CSS
- PASS — reduced motion CSS
- PASS — iOS back control
