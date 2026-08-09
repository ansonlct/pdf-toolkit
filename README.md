# PDF Toolkit Mobile

Mobile-first PDF 工具箱，純 HTML / CSS / JavaScript，適合部署到 GitHub Pages。

## V1 已實作

- 合併 PDF
- 分割 PDF（多個頁碼範圍 → ZIP）
- 提取頁面
- 刪除頁面
- 旋轉頁面
- 重新排序頁面
- JPG / PNG → PDF
- PDF → PNG / JPEG（ZIP）
- 中文文字水印
- 新增頁碼
- 清理常見 Metadata
- 查看 PDF 基本資料
- PWA / 加入主畫面
- Light / Dark mode
- 大檔案 memory guard（80 MB 警告；200 MB hard stop）
- 下載及 Web Share API（browser 支援時）

## 私隱模型

文件資料由瀏覽器本機讀取及處理；本專案沒有 upload API 或 backend。

V1 從版本鎖定 CDN 載入 `pdf-lib`、`JSZip` 和 `pdfjs-dist`。文件本身不會傳到 CDN，但首次使用需要網絡載入依賴。Service Worker 會快取成功載入的資源。

如果需要「首次開啟亦完全離線 / 不接觸第三方 CDN」，應將三個依賴 vendor 到 repository，再把 URL 改成本地路徑。

## 本機測試

不要直接以 `file://` 開啟，因為 ES module / Service Worker 需要 HTTP(S)。

```bash
cd pdf_toolkit_mobile
python3 -m http.server 8080
```

再開：`http://localhost:8080`

## GitHub Pages 部署

1. 建立 GitHub repository。
2. 將本資料夾所有檔案 push 到 `main` branch。
3. Repository → Settings → Pages。
4. Source 選擇 **GitHub Actions**。
5. 專案已包括 `.github/workflows/pages.yml`。
6. Push 後等 `Deploy static content to Pages` workflow 完成。

## iPhone

Safari 開啟 GitHub Pages 網址 → 分享 → **加入主畫面**。

## Android

Chrome 開啟網址 → 選單 → **Install app / Add to Home screen**（字眼視版本而定）。

## 技術限制

- V1 不提供移除 PDF 密碼。
- Metadata 清理只處理常見 document info fields，不等於完整 forensic sanitization。
- OCR、真正影像重採樣壓縮、PDF/A、Office 高 fidelity conversion 尚未實作。
- 大型 PDF 實際可處理上限取決於裝置 RAM、頁面影像大小和 browser。
- PDF → 圖片會逐頁 render，降低峰值記憶體，但高解析度頁面仍可能很吃 RAM。
- Web Share 取決於 browser 對檔案分享的支援。

## Runtime dependencies

- pdf-lib 1.17.1
- JSZip 3.10.1
- PDF.js / pdfjs-dist 6.2.108

## License

App source: MIT。第三方 libraries 依各自授權條款。
