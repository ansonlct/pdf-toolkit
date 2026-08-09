# Validation Report — PDF Toolkit Mobile v1.3.0

## Static checks

- PASS — `app.js` parses with `node --check`.
- PASS — `sw.js` parses with `node --check`.
- PASS — `manifest.webmanifest` parses as JSON.
- PASS — local HTML asset references exist.
- PASS — local HTTP smoke retrieval of `index.html` and `app.js`.
- PASS — v1.3 build marker present.
- PASS — professional grouped tool UI present; tool cards contain icon + name only.
- PASS — merge first-page preview state defaults to OFF and can be enabled with a toggle.
- PASS — split visual mode uses a horizontal filmstrip with between-page cut controls.
- PASS — PDF unlock tool is wired to QPDF WASM `--decrypt` flow.

## Runtime status

Full end-to-end browser execution against CDN-hosted dependencies was **not** executed in the packaging environment. In particular, the following need real-device / deployed-HTTPS validation:

- iPhone Safari touch drag ordering.
- Split filmstrip behavior in portrait and landscape.
- AES-256 protect runtime.
- QPDF WASM unlock runtime and password error handling.
- DOCX/XLSX conversion fidelity.
- PWA installation and service-worker cache behavior on GitHub Pages.

Do not treat the static PASS results as proof of those runtime behaviors until tested on the deployment target.
