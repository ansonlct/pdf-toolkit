# PDF Toolkit v1

Mobile-first PDF 工具箱，可部署至 GitHub Pages / PWA。

## 本版修正

- 工具頁 navigation bar 永遠置頂。
- 工具內容改由獨立 `.sheet-scroll` 區域滾動。
- 禁止一般頁面文字 highlight / selection。
- 禁止 pinch zoom、gesture zoom 及 double-tap zoom。
- 顯示名稱統一為 `PDF Toolkit v1`。
- 私隱文字更新為：
  `🔒 全面採用本地化資料處理，所有文件皆不會上傳至雲端或外部伺服器。`
- ZIP 不再包含任何 `V1_X_CHANGES.md`。

## 本機測試

```bash
cd pdf_toolkit_v1
python3 -m http.server 8080
```

瀏覽：

```text
http://localhost:8080
```

## GitHub Pages

Repository → Settings → Pages → Source: GitHub Actions。

## 注意

頁面縮放已按產品要求關閉。Search、密碼及其他輸入欄仍保留正常文字輸入能力。
