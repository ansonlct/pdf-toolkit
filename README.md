# PDF Toolkit v1 — PDF Inspector Hotfix

This build fixes the `PDF 資料` error:

```text
Cannot perform Construct on a detached ArrayBuffer
```

## Root cause

PDF.js may transfer/detach the ArrayBuffer supplied as its `data`.

The previous build reused that same buffer for:
- PDF.js
- pdf-lib
- binary inspection

After PDF.js detached it, pdf-lib could no longer construct a view over the same buffer.

## Fix

The PDF Inspector now creates independent copies:

```text
sourceBuffer
├─ rawBytes    -> binary/header/XMP inspection
├─ pdfjsBytes  -> PDF.js only
└─ pdfLibBuf   -> pdf-lib only
```

Therefore PDF.js cannot detach the buffer used later by pdf-lib.

## Additional fix

Added a real `favicon.ico` plus an explicit icon link, removing the browser-console favicon 404.

## Privacy

🔒 全面採用本地化資料處理，所有文件皆不會上傳至雲端或外部伺服器。


## 新功能：PDF → 圖片（自訂頁面選擇）

`PDF → 圖片` 已加入頁面選擇：

- 全部頁面
- 自訂頁面
- 頁碼輸入格式：`1,3,5-7`
- 小型 PDF（20 頁或以下）可直接點按頁碼選取
- 輸出格式：PNG / JPEG
- 清晰度：1× / 1.5× / 2× / 3×
- 輸出方式：
  - 自動（只選 1 頁時直接輸出單張圖片；多頁輸出 ZIP）
  - 永遠輸出 ZIP

範例：
- `1` → 第 1 頁
- `2,4,6` → 第 2、4、6 頁
- `3-5` → 第 3 至 5 頁
- `1,3,5-7` → 第 1、3、5、6、7 頁


## 新增：提取 PDF 圖片

- 掃描 PDF.js page operator list 找出頁面 bitmap image resources。
- 支援全部頁面或自訂頁碼範圍。
- 支援 PNG / JPEG。
- 可忽略小於 16×16 px 的小型圖片。
- 圖片輸出 ZIP，檔名包含 page、image sequence、pixel dimensions。
- 單次最多 200 張，避免手機 RAM 過高。
- 輸出為 PDF.js 解碼後的 pixels，不保證保留原始 JPEG/JPX bitstream。

## 新增：移除 PDF 圖片

採 QPDF 結構層修改，而不是把整頁轉成 screenshot。

流程：
1. QPDF JSON 掃描所有 `/Subtype /Image` stream objects。
2. 每個 Image XObject 以空白 Form XObject 替換。
3. 原本 resource references 保持有效，但圖片不再繪製。
4. 文字、向量及頁面結構可盡量原樣保留。

限制：
- PDF inline images 不是獨立 Image XObject，因此少數文件可能仍有 inline image 殘留。
- 加密 PDF 需要提供正確開啟密碼。


## Hotfix：主頁看不到「提取 PDF 圖片 / 移除 PDF 圖片」

兩個工具原本已經存在於 `app.js`：

- `提取 PDF 圖片`
- `移除 PDF 圖片`

問題原因是舊 Service Worker 使用固定 cache 名稱 `pdf-toolkit-v1-release`
以及 cache-first 策略，GitHub Pages 部署新 `app.js` 後仍可能從舊 cache
載入舊首頁工具列表。

本 hotfix 已：

- 更新 Service Worker cache version
- activation 時刪除舊 cache
- `skipWaiting()` + `clients.claim()`
- navigation / `index.html` / `app.js` / `styles.css` 改為 network-first
- Service Worker registration 使用 `updateViaCache: 'none'`
- 新 Service Worker 接管時自動 reload 一次
- `app.js` / `styles.css` 加 cache-busting query

因此之後更新工具列表不應再因舊 PWA cache 而消失。

部署後如果瀏覽器仍停留在很舊的 PWA session，可先重新整理一次。
