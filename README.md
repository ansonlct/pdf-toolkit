# PDF Toolkit Mobile v1.5.0

Mobile-first PDF 工具箱，可部署 GitHub Pages / PWA。

## v1.5 重點

### iOS Settings 式工具首頁
- 一列一個工具。
- 左方彩色工具 icon。
- 中間只顯示工具名稱。
- 右方 chevron。
- 以「整理 PDF / 編輯 PDF / PDF 安全 / 文件轉換 / 其他工具」分組。
- 首頁工具不顯示介紹文字。

### 工具展開動畫
按工具列後，工具頁會由該列的位置縮放展開，而不是突然彈出。
返回時做相反收合動畫。
支援 `prefers-reduced-motion`。

### 移除 PDF 密碼修正
- `.pdf` 在 Unlock 工具不再因過度嚴格的前置 magic check 被直接拒絕。
- 一般 PDF 工具的 header scan 由 1 KiB 增至 64 KiB。
- Unlock 交由 QPDF 做最終 PDF parsing。
- QPDF WASM 改為 browser sample 同類流程：
  1. 建立 MEMFS 工作目錄。
  2. 寫入 `work/input.pdf`。
  3. `callMain(["work/input.pdf", "--password=...", "--decrypt", "work/output.pdf"])`。
  4. 從 MEMFS 讀取 `work/output.pdf`。
- 錯誤分類：密碼錯誤 / QPDF parser error / 不支援加密 / engine load error。
- 不再將所有未知錯誤一律顯示成「PDF 已損毀」。

## 注意
「移除 PDF 密碼」需要你知道正確開啟密碼。本功能不破解未知密碼。

## 本機啟動

```bash
cd pdf_toolkit_mobile_v1_5_0
python3 -m http.server 8080
```

再開：

```text
http://localhost:8080
```

## GitHub Pages
Settings → Pages → Source: GitHub Actions。

## 真機測試建議
- iPhone portrait / landscape
- Reduce Motion
- Dark Mode
- Settings row → tool page open/close transition
- 有密碼 PDF：正確密碼
- 有密碼 PDF：錯誤密碼
- owner-restriction-only PDF
- 非標準但正常 PDF
