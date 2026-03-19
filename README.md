# Percentage Cashback Calculator

Lightweight Chrome Extension for fast cashback and percentage calculations, with a compact popup, large view, and English/Ukrainian support.

## Features

- Instant cashback calculation: `amount x percent / 100`
- Instant percent calculation: `part / total x 100`
- English and Ukrainian UI
- Popup optimized for quick daily use
- Large standalone calculator view
- Settings saved with `chrome.storage.sync`
- Optional remembered last values
- Dot and comma decimal input support
- Copy result and reset actions

## Files

- `manifest.json`
- `popup.html`, `popup.css`, `popup.js`
- `large.html`, `large.css`, `large.js`
- `options.html`, `options.css`, `options.js`
- `shared.js`
- `icons/icon.svg`
- `icons/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`

## Install

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this folder: `/Users/brnv/Documents/Cashback calculator`.

## Notes

- Default mode is Cashback.
- Language, mode, and remember-values preference are stored in `chrome.storage.sync`.
- Last entered values are stored in `chrome.storage.local` only when remember-values is enabled.
- The extension includes a simple red/white icon set for Chrome toolbar and extension pages.
