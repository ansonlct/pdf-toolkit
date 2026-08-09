# PDF Toolkit Mobile v1.4.0

Mobile-first PDF 工具箱，可部署到 GitHub Pages / PWA。

## v1.4 重點

- 分割 PDF：Visual Split 加入/取消分割線時 **不再重建整個 filmstrip**，所以不會跳回 Page 1。
- 分割輸出檔名加入頁碼範圍：
  - `report_page1-3.pdf`
  - `report_page4-6.pdf`
- 合併 PDF：拖放或選檔時嚴格檢查 `.pdf` 副檔名及 `%PDF-` 檔頭；非 PDF 不會加入清單。
- 合併 PDF 首頁縮圖仍然 **預設關閉**。
- 移除 PDF 密碼：改用 browser-first `qpdf-wasm-esm-embedded` 單檔 WASM/ESM 載入方式，並加入 qpdf stderr/stdout 錯誤回報。
- UI 重設為 iOS 27 / Liquid Glass-inspired：
  - 半透明 glass surfaces
  - backdrop blur / saturation
  - floating header
  - rounded pill controls
  - stronger information hierarchy
  - Light / Dark mode
- 首頁工具仍只顯示「Icon + 名稱」，沒有介紹文字。

## 移除 PDF 密碼

需要知道 PDF 的開啟密碼（或該 PDF 只有限制權限、沒有 open password）。

本功能不破解未知密碼。

使用 QPDF `--decrypt` 產生新 PDF；原始 PDF 不會被修改。

## 本機測試

```bash
cd pdf_toolkit_mobile_v1_4_0
python3 -m http.server 8080
```

打開：

```text
http://localhost:8080
```

## GitHub Pages

Repository → Settings → Pages → Source: GitHub Actions。

`.github/workflows/pages.yml` 已包括在專案。

## 仍需真機驗證

靜態 validation 不等同 iPhone Safari 真機 regression test。建議部署 HTTPS 後測：

- iPhone portrait / landscape
- Visual Split scroll position
- 20頁 Visual Split
- 100頁 Range Split
- Merge drag ordering
- 非 PDF drag/drop rejection
- password-protected PDF unlock
- owner-restriction-only PDF unlock
