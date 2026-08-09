# PDF Toolkit v1

Mobile-first PDF 工具箱，可部署至 GitHub Pages / PWA。

## PDF 資料 — Detailed PDF Inspector

`PDF 資料` 已升級為詳細 PDF Inspector，資料來源以 browser 本機的 PDF.js / pdf-lib 為主。

顯示：

- PDF 摘要
- 基本資訊
  - Pages
  - File Size / bytes
  - PDF Version
  - Language
  - Page Mode / Layout
  - Linearized
  - compression filters detected
- 文件資訊
  - Title / Author / Subject / Keywords
  - Producer / Creator
  - Created / Modified / Trapped
  - inferred source type
  - XMP Document ID / Instance ID
- 安全性
  - encryption status
  - Printing / Modifying / Copying / Annotation / Forms / Accessibility / Assembly permissions
- 合規 metadata identifiers
  - PDF/A / PDF/X / PDF/E / PDF/VT / PDF/UA / PDF/B / PDF/SEC
  - 注意：這不是正式合規驗證器
- 內容統計
  - estimated WordCount
  - estimated ParagraphCount
  - CharacterCount
  - Text Characters Count
  - Annotations
  - Images / paint operations
  - Links
- 文件結構
  - Form fields
  - Attachments
  - JavaScript
  - Layers
  - Outline / Bookmarks
  - Digital Signatures (browser API 有支援時)
  - Tagged PDF
- 每頁詳細資料
  - width / height in pt, 72-DPI px, inch, cm
  - standard page approximation
  - orientation / rotation
  - MediaBox / CropBox / BleedBox / TrimBox / ArtBox
  - text / words / paragraphs / annotations / links / images
- Fonts
  - internal font ID
  - font name/family
  - usage count
  - embedded state when PDF.js exposes it
  - Type3 / vertical
  - bold/italic inference
- Raw XMP XML
- JSON report download
- summary copy

## Accuracy notes

- Word/paragraph counts are derived from the PDF text layer. Scanned PDFs without OCR may report zero.
- Image count is based on PDF.js image paint operations; it is not a forensic inventory of every XObject.
- Font embedded/bold/italic values are best-effort where PDF.js exposes enough information.
- Compliance detection checks metadata identifiers only and must not be treated as formal PDF/A/PDF/X/PDF/UA validation.

## Privacy

🔒 全面採用本地化資料處理，所有文件皆不會上傳至雲端或外部伺服器。
