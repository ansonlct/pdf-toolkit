# Validation Report — PDF Toolkit v1 / Detailed PDF Inspector

## Automated checks

- app.js syntax
- service worker syntax
- detailed `setupInfo`
- PDF.js metadata API calls
- permissions inspection
- attachments inspection
- JavaScript inspection
- form-field inspection
- optional content/layers inspection
- PDF version header parser
- page-box calls
- word/paragraph statistics
- font aggregation
- XMP output
- JSON download
- password prompt fallback for encrypted PDFs

## Runtime boundary

Different PDFs expose different amounts of metadata. Missing values are shown as `—`, `-`, `Empty`, or `Unknown` instead of being invented.

Word/paragraph counts and font embedding/style details are explicitly best-effort estimates when the PDF format/API does not expose a definitive value.

## Build results

- PASS — app.js syntax
- PASS — sw.js syntax
- PASS — detailed setupInfo
- PASS — getMetadata
- PASS — getPermissions
- PASS — getAttachments
- PASS — getFieldObjects
- PASS — getJSActions
- PASS — getOptionalContentConfig
- PASS — getPageMode
- PASS — getMediaBox
- PASS — getCropBox
- PASS — getBleedBox
- PASS — getTrimBox
- PASS — getArtBox
- PASS — XMP raw
- PASS — JSON download
- PASS — Intl Segmenter
- PASS — encrypted password prompt
