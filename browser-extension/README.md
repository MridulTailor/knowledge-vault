# Knowledge Vault Browser Extension

A browser extension that allows you to save and manage knowledge from anywhere on the web directly to your Knowledge Vault instance.

## Features

- 🔖 Save entire web pages as bookmarks
- ✂️ Save selected text snippets
- 📝 Create quick notes
- 🔍 Search your knowledge vault
- ⌨️ Keyboard shortcuts (Ctrl+Shift+S, Ctrl+Shift+N)

## Building for Different Browsers

### Chrome/Edge (Manifest V3 with Service Worker)

1. Build the extension:

```bash
npm run build
```

2. Create distribution package:

```bash
npm run pack
```

3. Load in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this folder
   - Uses `manifest.json`

### Firefox (Manifest V3 with Background Scripts)

1. Build the extension:

```bash
npm run build
```

2. Create Firefox distribution package:

```bash
npm run pack:firefox
```

3. Load in Firefox:
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `manifest-firefox.json`
   - Or upload the generated `knowledge-vault-extension-firefox.zip`

### Both Browsers

Create packages for both browsers:

```bash
npm run pack:all
```

## Key Differences Between Browser Versions

| Feature      | Chrome          | Firefox                                 |
| ------------ | --------------- | --------------------------------------- |
| Manifest     | `manifest.json` | `manifest-firefox.json`                 |
| Background   | Service Worker  | Background Scripts                      |
| Extension ID | Auto-generated  | Required (`knowledge-vault@mridul.dev`) |
| Min Version  | Chrome 88+      | Firefox 109+                            |

## Configuration

1. Click the extension icon in your browser
2. Go to Options/Settings
3. Enter your Knowledge Vault server URL
4. Sign in with your credentials
5. Test the connection

## Development

For development, load the extension directly from this folder using the browser's developer tools. Changes to most files will require reloading the extension.

## Files

- `manifest.json` - Chrome/Edge manifest
- `manifest-firefox.json` - Firefox manifest
- `background.js` - Background script (works for both browsers)
- `popup.html/js/css` - Extension popup interface
- `content.js/css` - Content script for web pages
- `options.html/js/css` - Extension settings page
