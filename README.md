# PDF Toolkit Mobile v1.1.0

**Visual Page Editor & Basic Office Conversion**

## v1.1 新功能

- PDF 頁面縮圖
- 每頁右上角 `×` 標記刪除
- Undo / Reset
- 手機長按拖拉重新排序（SortableJS）
- 大型 PDF 採 lazy thumbnail rendering
- 文字水印真實 PDF 頁面預覽
- 水印可拖動位置
- 水印文字 / 大小 / 透明度 / 角度 / 顏色
- DOCX → PDF Basic
- XLSX → PDF Basic
- Markdown → PDF
- HTML → PDF
- TXT → PDF

保留：Merge / Split / Image → PDF / PDF → Image / PDF Info / PWA / Share / Download。

## 注意：Office Basic Conversion

DOCX / XLSX conversion 是 browser-side **Basic** conversion，不保證 Microsoft Word / Excel 100% fidelity。

不保證：SmartArt、VBA、Macros、Track Changes、複雜浮動物件、Pivot Chart、精確 Microsoft 分頁等。

`.doc` / `.xls` 舊格式暫不支援。

## 私隱

本專案沒有文件 upload API 或 backend。文件由 browser File API 讀取及在本機處理。

### Runtime libraries

目前 build 使用 version-pinned CDN 取得第三方 JavaScript libraries：

- pdf-lib 1.17.1
- PDF.js 4.10.38
- JSZip 3.10.1
- SortableJS 1.15.6
- Mammoth 1.8.0
- SheetJS xlsx 0.18.5
- html2pdf.js 0.10.2
- Marked 12.0.2

因此首次使用需要 Internet。文件本身不會由本 App 上傳到這些 CDN。

如需要**完全 offline / 不連第三方 CDN**，下一步應把上述 runtime files vendor 入 `/vendor`，並把 `index.html` / `app.js` URL 改成本地相對路徑。

## GitHub Pages

1. 建立 repository。
2. 把本資料夾內所有檔案 push 到 `main`。
3. GitHub → Settings → Pages → Source 選 **GitHub Actions**。
4. 等待 `Deploy static content to Pages` workflow 完成。

## 本機測試

```bash
cd pdf_toolkit_mobile_v1_1_0
python3 -m http.server 8080
```

然後瀏覽：

```text
http://localhost:8080
```

不要直接用 `file://` 開啟，因為 ES Module / Service Worker 需要 HTTP(S)。

## 建議驗收

- iPhone Safari：10 / 100 頁 PDF，刪頁、Undo、Touch drag、輸出頁序一致。
- Android Chrome：同上。
- 中文水印位置及透明度。
- DOCX：文字、圖片、一般 table。
- XLSX：多 Sheet、merged cells、中文、日期及百分比。

## Known limits

- 200 MB client-side file-size safety limit。
- PDF.js / Office runtime libraries currently rely on CDN。
- Browser conversion 不等於 Adobe / Microsoft Office 專業排版引擎。
