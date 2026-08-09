# PDF Toolkit Mobile v1.7.0

## v1.7 UI

### iOS Large Title
首頁初始狀態：
- 頂部 navigation bar 不顯示 `PDF Toolkit`。
- `PDF Toolkit` 以 large title 顯示在內容頂部。

向上掃動頁面：
- large title 隨內容向上移走。
- 當 large title 進入 navigation bar 區域後，compact `PDF Toolkit` 在頂部淡入。
- 向下返回頂部後，compact title 再消失。

### Bottom Search
Search 已由頁面上方移到底部：
- fixed floating search pill
- translucent blur
- safe-area aware
- 進入任何 PDF 工具時自動隱藏

### Top buttons
- 移除 `+` 安裝按鈕
- 移除頂部黑白模式按鈕

### 設定
最底新增 `設定` group：
- 深色模式：iOS toggle
- PayMe 捐款
- PayPal 捐款

`DONATION_LINKS` 位於 `app.js` 頂部。由於未提供收款人的 PayMe / PayPal 個人付款連結，預設保持空白；點擊時會提示尚未設定，而不會虛構收款 URL。

### iPhone Back focus
工具頁 `<` 已加入 Safari/iPhone focus-ring suppression：
- `outline:none`
- `-webkit-tap-highlight-color: transparent`
- pointer-up 後主動 blur

## Donation configuration

在 `app.js`：

```js
const DONATION_LINKS={
  payme:'YOUR_PAYME_LINK',
  paypal:'YOUR_PAYPAL_LINK'
};
```

## Local test

```bash
cd pdf_toolkit_mobile_v1_7_0
python3 -m http.server 8080
```
