# PDF Toolkit Mobile v1.2.0

Mobile-first PDF 工具箱，可部署到 GitHub Pages。

## v1.2 重點

- 合併 PDF：每份文件顯示第 1 頁縮圖；長按拖拉上/下重新排序；可移除或追加 PDF。
- 分割 PDF：20 頁或以下預設縮圖模式；點頁與頁之間的 `＋` 加入/取消分割線。
- 分割 PDF：超過 20 頁預設手動範圍模式；亦可使用「每 N 頁」快速產生範圍，或自行切換縮圖。
- PDF 加密：AES-256 Open Password + Owner Password + 常用權限。GitHub Pages 的 HTTPS 可直接使用。
- 工具首頁只顯示圖示及名稱，不顯示各工具介紹文字。
- 保留 v1.1 的縮圖刪頁/拖拉排序、水印預覽、DOCX/XLSX Basic conversion 等功能。

## PDF 加密

使用 `@pdfsmaller/pdf-encrypt 1.2.0` 的 browser UMD build。AES-256 需要 Secure Context，因此正式 GitHub Pages (HTTPS) 或 localhost 可使用；普通 HTTP 會拒絕執行，而不會自動降級到 RC4。

PDF permission flags（列印、複製、修改等）由 PDF reader 執行；它們不等同 DRM。真正的內容保密依賴 Open Password + AES-256。

## Runtime libraries

- pdf-lib 1.17.1
- @pdfsmaller/pdf-encrypt 1.2.0
- JSZip 3.10.1
- SortableJS 1.15.6
- PDF.js 4.10.38
- Mammoth 1.8.0
- SheetJS 0.18.5
- html2pdf.js 0.10.2
- Marked 12.0.2

目前 runtime libraries 由版本鎖定 CDN 載入；文件本身沒有 upload API。

## 本機測試

```bash
cd pdf_toolkit_mobile_v1_2_0
python3 -m http.server 8080
```

打開 `http://localhost:8080`。localhost 可使用 Web Crypto secure-context 能力。

## GitHub Pages

Push 整個目錄到 `main`，再於 Repository → Settings → Pages → Source 選 GitHub Actions。專案已包含 `.github/workflows/pages.yml`。
