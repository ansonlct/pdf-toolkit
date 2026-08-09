# Validation Report — PDF Toolkit v1 PDF Inspector Hotfix

## Automated checks

- app.js syntax
- service worker syntax
- detached-buffer fix present
- independent `rawBytes`
- independent `pdfjsBytes`
- independent `pdfLibBuf`
- PDF.js uses only `pdfjsBytes`
- pdf-lib uses only `pdfLibBuf`
- binary inspection uses `rawBytes`
- favicon.ico exists
- favicon link exists

## Runtime acceptance test

Use the same PDF that previously produced:

```text
Cannot perform Construct on a detached ArrayBuffer
```

Expected:
1. PDF.js parses the file.
2. pdf-lib receives its own untouched ArrayBuffer.
3. PDF 資料 sections render instead of showing the detached-buffer error.

## Build results

- PASS — app.js syntax
- PASS — sw.js syntax
- PASS — source buffer
- PASS — raw independent copy
- PASS — pdfjs bytes
- PASS — pdf-lib independent buffer
- PASS — PDF.js isolated
- PASS — pdf-lib isolated
- PASS — favicon.ico exists
- PASS — favicon HTML link
- PASS — no shared rawBuffer getDocument
- PASS — no shared rawBuffer pdf-lib


## PDF → 圖片 page-selection checks

- `setupPdf2img()` loads page count
- supports `all` / `custom` mode
- accepts page range syntax via `parsePages()`
- small PDF page chips (<=20 pages)
- auto single-image output when 1 page is selected
- ZIP output for multi-page export

## Build results

- PASS — app.js syntax
- PASS — setupPdf2img async
- PASS — runPdf2img
- PASS — page mode select
- PASS — page range input
- PASS — page chip grid
- PASS — selected pages helper
- PASS — single page auto output
- PASS — zip output filename
- PASS — sw.js syntax


## Image tools checks

- Extract tool registered
- Remove tool registered
- PDF.js operator-list image scanning present
- PDF.js image-object resolver present
- PNG/JPEG image conversion present
- custom page range for image extraction present
- QPDF JSON image-object scan present
- `/Subtype /Image` detection present
- QPDF update JSON replaces images with empty `/Subtype /Form`
- output PDF signature check present

## Build results

- PASS — app.js syntax
- PASS — sw.js syntax
- PASS — extract tool
- PASS — remove tool
- PASS — extract setup
- PASS — extract run
- PASS — operator list
- PASS — image op codes
- PASS — image object resolve
- PASS — image pixel conversion
- PASS — custom extraction pages
- PASS — remove setup
- PASS — remove run
- PASS — qpdf json image scan
- PASS — image subtype detect
- PASS — empty form replacement
- PASS — qpdf update
- PASS — valid output check
