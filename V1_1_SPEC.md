# v1.1 Release Gates

1. Visual Page Manager
   - thumbnail grid
   - × delete
   - Undo / Reset
   - touch drag reorder
   - final PDF order matches UI

2. Watermark Preview
   - PDF.js actual page preview
   - draggable watermark
   - text / size / opacity / rotation / color
   - Chinese text via Canvas PNG overlay for export

3. Office Basic Conversion
   - DOCX via Mammoth HTML conversion + html2pdf
   - XLSX via SheetJS sheet HTML + html2pdf
   - Markdown via Marked + html2pdf
   - HTML / TXT + html2pdf

4. Safety
   - source file is never modified
   - no upload API
   - 200 MB client-side hard limit
   - lazy PDF thumbnails
