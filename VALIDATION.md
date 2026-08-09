# Validation Report — v1.4.0

## Static checks performed

- JavaScript syntax: PASS (Node `--check`)
- Service worker syntax: PASS
- Manifest JSON: PASS
- HTML local asset references: PASS
- GitHub Pages workflow presence: PASS
- Version markers: PASS
- Split non-rerender cut handler present: PASS
- Split `_pageX-Y.pdf` naming logic present: PASS
- PDF extension/signature validation present: PASS
- Embedded QPDF ESM loader present: PASS

## Runtime status

Not claimed as fully PASS in this build environment because outbound browser/CDN execution and iPhone Safari are not available here.

The unlock implementation now follows a browser-native QPDF ESM/WASM pattern and captures QPDF output for diagnostics, but a real encrypted PDF should still be tested after HTTPS deployment.

## Acceptance tests recommended

1. Open 12-page PDF, scroll to pages 8–10, add cut between 9/10 → viewport must remain at the same location.
2. Split at 3 and 6 → ZIP must contain `*_page1-3.pdf`, `*_page4-6.pdf`, `*_page7-12.pdf`.
3. Drag `.jpg`, `.docx`, `.txt` into Merge PDF → must be rejected.
4. Rename a non-PDF file to `.pdf` → must be rejected by `%PDF-` signature validation.
5. Upload valid PDF in Merge → accepted; preview toggle initially OFF.
6. Unlock known-password AES-128/AES-256 PDF → output opens without password.
7. Wrong password → clear failure message; no fake success output.

## Automated build checks

- PASS — app.js syntax
- PASS — sw.js syntax
- PASS — asset ./styles.css
- PASS — asset ./app.js
- PASS — asset ./manifest.webmanifest
- PASS — asset ./icons/icon-192.png
- PASS — version 1.4.0
- PASS — split in-place cut
- PASS — split page-range names
- PASS — PDF header validation
- PASS — embedded qpdf loader
- PASS — merge preview default false
