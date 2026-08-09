# Validation Report — v1.6.1

## Automated static checks

- JavaScript syntax
- Service worker syntax
- manifest JSON
- GitHub Pages workflow
- dialog cancel target guard
- file input cancel propagation guard
- onchange no-file guard
- route restored before close animation
- empty sticky actions hidden
- empty workspace hidden
- hidden summary enforced

## Runtime boundary

Native file-picker behavior is browser/OS integration behavior, so final
acceptance should be checked in the same browser shown in the user's screenshot
and on iPhone Safari.

## Required manual tests

### Test A — File picker cancel
Open a tool → choose file → cancel the OS picker.
Expected: current tool remains visible and unchanged.

### Test B — Back
Press `<`.
Expected: tool slides right over an immediately visible home screen.

### Test C — Empty state
Open 管理 PDF 頁面 without selecting a file.
Expected: only the file selector and privacy text are visible; no empty rounded bar.

## Build check results

- PASS — app.js syntax
- PASS — sw.js syntax
- PASS — asset styles.css
- PASS — asset app.js
- PASS — asset manifest.webmanifest
- PASS — asset icons/icon-192.png
- PASS — asset .github/workflows/pages.yml
- PASS — version 1.6.1
- PASS — dialog target guard
- PASS — file cancel stopPropagation
- PASS — no-selection onchange guard
- PASS — home restored before close
- PASS — close pointer lock
- PASS — empty action bar hidden
- PASS — empty workspace hidden
- PASS — hidden file summary enforced
