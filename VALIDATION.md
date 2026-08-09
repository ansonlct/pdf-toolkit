# Validation Report — PDF Toolkit v1

## Automated build checks

- JavaScript syntax
- Service worker syntax
- manifest JSON
- GitHub Pages workflow presence
- fixed tool-navigation DOM structure
- independent `.sheet-scroll`
- viewport `user-scalable=no`
- gesture zoom prevention
- double-click zoom prevention
- global selection prevention
- input/textarea selection exception
- product name `PDF Toolkit v1`
- new privacy statement
- no `V1_X_CHANGES.md` files

## Manual iPhone checks recommended

1. Enter a long tool page and scroll from top to bottom.
   Expected: tool navigation bar never moves.
2. Long-press ordinary UI labels.
   Expected: no text highlight/callout.
3. Pinch with two fingers.
   Expected: page does not zoom.
4. Double-tap ordinary page content.
   Expected: page does not zoom.
5. Tap a password/text field.
   Expected: input remains editable.

## Build results

- PASS — app.js syntax
- PASS — sw.js syntax
- PASS — manifest JSON
- PASS — asset index.html
- PASS — asset styles.css
- PASS — asset app.js
- PASS — asset manifest.webmanifest
- PASS — asset .github/workflows/pages.yml
- PASS — asset icons/icon-192.png
- PASS — fixed inner tool scroller
- PASS — fixed nav flex
- PASS — sheet no scroll
- PASS — viewport no zoom
- PASS — gesture prevention
- PASS — double tap prevention
- PASS — user-select none
- PASS — form selection retained
- PASS — PDF Toolkit v1 title
- PASS — privacy statement
- PASS — no V1_X_CHANGES files
