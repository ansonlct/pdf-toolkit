# Validation Report — PDF Toolkit v1 Clean Audited Build

## Decision

The two unreliable tools have been fully removed:

- 提取 PDF 圖片
- 移除 PDF 圖片

Removal includes the tool registry entries, dispatcher branches, image-tool-only
state and implementation/helper functions. They are not merely hidden in CSS.

## Automated source audit

- PASS — app.js syntax
- PASS — sw.js syntax
- PASS — manifest JSON
- PASS — required file index.html
- PASS — required file styles.css
- PASS — required file app.js
- PASS — required file sw.js
- PASS — required file manifest.webmanifest
- PASS — required file favicon.ico
- PASS — required file icons/icon-192.png
- PASS — required file icons/icon-512.png
- PASS — required file icons/icon-512-maskable.png
- PASS — required file .github/workflows/pages.yml
- PASS — 14 supported tools remain: `['pages', 'merge', 'split', 'watermark', 'protect', 'unlock', 'img2pdf', 'pdf2img', 'docx', 'xlsx', 'markdown', 'html', 'txt', 'info']`
- PASS — tool IDs unique: `['pages', 'merge', 'split', 'watermark', 'protect', 'unlock', 'img2pdf', 'pdf2img', 'docx', 'xlsx', 'markdown', 'html', 'txt', 'info']`
- PASS — removed source code absent: extractimg
- PASS — removed source code absent: removeimg
- PASS — removed source code absent: setupExtractPdfImages
- PASS — removed source code absent: setupRemovePdfImages
- PASS — removed source code absent: runExtractPdfImages
- PASS — removed source code absent: runRemovePdfImages
- PASS — removed source code absent: qpdfScanPageImages
- PASS — removed source code absent: removeImageResourcesPdfLib
- PASS — 提取 PDF 圖片 removed from app
- PASS — 移除 PDF 圖片 removed from app
- PASS — registry / dispatcher consistent: `[]`
- PASS — HTML local reference exists ./app.js
- PASS — HTML local reference exists ./icons/icon-192.png
- PASS — HTML local reference exists ./manifest.webmanifest
- PASS — HTML local reference exists ./styles.css
- PASS — feature retained: fixed tool navigation
- PASS — feature retained: large title
- PASS — feature retained: bottom search
- PASS — feature retained: dark-mode toggle
- PASS — feature retained: file picker cancel protection
- PASS — feature retained: PDF to image page selection
- PASS — feature retained: detailed PDF inspector
- PASS — feature retained: visual split
- PASS — feature retained: visual page manager
- PASS — feature retained: merge
- PASS — feature retained: PDF unlock
- PASS — no V1_X_CHANGES.md
- PASS — privacy wording retained
- PASS — zoom disabled
- PASS — fresh SW cache
- PASS — SW skipWaiting
- PASS — SW clients.claim
- PASS — SW updateViaCache none

## HTTP smoke test

A local static HTTP server was started against the final project. The following
all returned HTTP 200:

- index.html
- app.js
- styles.css
- sw.js
- manifest.webmanifest
- favicon.ico
- icon-192.png
- icon-512.png
- icon-512-maskable.png

## Browser runtime boundary

The source/static audit and HTTP asset smoke tests passed. This build environment
did not provide a reliable automated iPhone/Safari interaction harness, so I do
not claim a full device-runtime regression PASS for every PDF/CDN operation.

The delivered build contains 14 remaining tools.
