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
