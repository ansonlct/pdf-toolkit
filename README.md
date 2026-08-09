# PDF Toolkit Mobile v1.3.0

Professional mobile-first PDF toolkit for GitHub Pages / PWA.

## v1.3 changes

- Professionalized UI with grouped tool sections; tool cards show only icon + tool name.
- Split PDF visual mode is now a **horizontal filmstrip**. Page thumbnails and `＋` cut controls sit side-by-side, so users swipe left/right instead of repeatedly scrolling down.
- Responsive split thumbnail sizing adapts to phone/tablet width and landscape orientation.
- Merge PDF keeps drag ordering but **first-page thumbnails are OFF by default**. Users can enable `顯示首頁預覽` when needed.
- Added **移除 PDF 密碼 / 加密** using QPDF WebAssembly. Open-password-protected PDFs require the correct password; PDFs with permission-only encryption may not require one.
- Existing AES-256 PDF protection tool retained.
- Existing visual page manager, watermark preview, Office basic conversion and image conversion retained.

## Run locally

Do not open with `file://`. Use HTTP(S):

```bash
cd pdf_toolkit_mobile_v1_3_0
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## GitHub Pages

The project includes `.github/workflows/pages.yml`. Push the project contents to `main`, then enable GitHub Pages with **GitHub Actions** as the source.

## Runtime privacy model

No upload API or backend is included. Document bytes are processed in browser memory.

This build still loads version-pinned runtime libraries from third-party CDNs. The unlock tool dynamically loads `@neslinesli93/qpdf-wasm@0.3.0` and its WASM binary on first use. A future vendored build can remove that network dependency.

## PDF unlock notes

- Unlocking does **not** guess or crack an unknown open password.
- For a PDF that requires an open password, the correct password must be supplied.
- The tool outputs a new `_unlocked.pdf`; it does not alter the original file.
- QPDF WebAssembly is used to preserve PDF structure while removing standard encryption.

## Limits

- Mobile browsers remain RAM constrained for very large or image-heavy PDFs.
- DOCX/XLSX conversion is basic browser rendering and is not Microsoft Office fidelity conversion.
- PDF permission flags are not DRM and depend on reader behavior.
