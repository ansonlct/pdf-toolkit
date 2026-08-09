# PDF Toolkit v1 — Clean Audited Build

今個 build 已取消兩個不可靠功能：

- 提取 PDF 圖片
- 移除 PDF 圖片

相關首頁入口、tool registry、dispatcher、state、helper functions 及實作代碼均已移除，
不是只將按鈕隱藏。

## 保留主要工具

- 管理 PDF 頁面
- 合併 PDF
- 分割 PDF
- 文字水印
- PDF 加密
- 移除 PDF 密碼
- 圖片 → PDF
- PDF → 圖片（支援自訂頁面）
- DOCX → PDF
- XLSX → PDF
- Markdown → PDF
- HTML → PDF
- TXT → PDF
- PDF 資料 / Detailed PDF Inspector

## Code audit

完成：

- `app.js` syntax check
- `sw.js` syntax check
- Manifest JSON check
- HTML 本地資產路徑檢查
- Tool registry unique-ID 檢查
- Tool registry ↔ dispatcher coverage 檢查
- 已取消功能的 residual/dead-code grep
- 主要功能 marker 檢查
- Service Worker freshness / update policy 檢查
- GitHub Pages workflow 檔案檢查
- 版本鎖定 external runtime URL 檢查
- privacy / zoom / selection / navigation UI requirement checks

## Service Worker

Cache key 已再次更新為：

`pdf-toolkit-v1-clean-audited-20260810`

並保留：
- `skipWaiting()`
- `clients.claim()`
- core HTML/JS/CSS network-first
- `updateViaCache: 'none'`

避免部署後仍看到舊工具列表。

## Privacy

🔒 全面採用本地化資料處理，所有文件皆不會上傳至雲端或外部伺服器。
