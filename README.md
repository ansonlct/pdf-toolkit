# PDF Toolkit Mobile v1.6.1

Bug-fix release based on v1.6.0.

## Fixed

### File picker Cancel
If the native file picker is opened and the user presses Cancel / closes it
without choosing a file, the current PDF tool now stays open.

Root cause:
`<input type="file">` emits a bubbling `cancel` event. The previous build's
dialog-level cancel handler treated that event as an Escape/dialog close.

### Back navigation blank frame
When pressing `<`, the home screen is restored immediately underneath the
tool route, then the tool page slides to the right. There is no intentional
blank intermediate screen.

### Empty rounded rectangle
The empty `stickyActions` container is now `display:none` whenever it has no
buttons. Empty workspace and hidden summary/result/progress areas are also
forced not to occupy space.

## Local test

```bash
cd pdf_toolkit_mobile_v1_6_1
python3 -m http.server 8080
```

## Regression tests

1. Open 管理 PDF 頁面.
2. Tap 選擇一個檔案.
3. Close the OS file picker without selecting a file.
4. Expected: remain in 管理 PDF 頁面.

Then:

1. Press `<`.
2. Expected: home screen is already visible behind the route as it slides right.
3. Expected: no blank frame.

Initial empty tool screen:
- no empty rounded action rectangle below the file selector.
