# PDF Toolkit Mobile v1.6.0

## 主要修正

### 1. iOS Push Navigation
工具不再以 modal / sheet 彈出。

- 按工具：新工具頁由右邊滑入，視覺上向左推入。
- 按 `<`：工具頁向右滑走，回到工具列表。
- 背後工具列表只作輕微左移，不再出現黑色 modal backdrop。
- 支援 `prefers-reduced-motion`。

### 2. iOS grouped-content 介面
- 首頁：Settings-style grouped list。
- 工具頁：iOS grouped background + white/dark grouped surfaces。
- Navigation bar / bottom action toolbar 才使用 blur / glass。
- 內容卡不再全部套用 glass，視覺更接近 iOS 的內容層級。

### 3. 下載按鈕窄畫面修正
Result 元件重寫：
- 長檔名不再將按鈕推出畫面。
- 600px 以下按鈕會放到獨立一行。
- 390px 以下「下載 / 分享」上下排列。
- 長檔名可以 wrap。
- 產生結果後會溫和 scroll 到 result 附近。

## 本機測試

```bash
cd pdf_toolkit_mobile_v1_6_0
python3 -m http.server 8080
```

## GitHub Pages
Repository → Settings → Pages → Source: GitHub Actions。

## 注意
本 build 做了 static / syntax / responsive-rule validation；iPhone Safari 真機 animation timing 仍應在 HTTPS 部署後測試。
