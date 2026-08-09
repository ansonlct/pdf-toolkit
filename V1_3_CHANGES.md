# v1.3.0 Change Log

## Split PDF
- Visual split changed from vertical stack to horizontal filmstrip.
- `＋`/`✂` controls are placed between adjacent page thumbnails.
- Responsive card width changes automatically with viewport width/orientation.
- Visual mode still defaults for PDFs with 20 pages or fewer; range mode defaults above 20 pages.

## PDF Security
- Added `移除 PDF 密碼` tool.
- Uses QPDF WebAssembly `--decrypt` in the browser.
- Password is optional for permission-only encryption; required when an open password is enforced.

## Merge PDF
- Drag ordering retained.
- First-page thumbnails are disabled by default.
- Added explicit `顯示首頁預覽` toggle.

## UI
- New professional navigation/header.
- Tool sections grouped into Organize, Edit, Security, Convert, Utility.
- Tool cards contain icon + name only; no tool descriptions.
- Refined spacing, typography, borders, dialogs, progress and result surfaces.
