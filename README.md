# Sharp Browser Frame

Post-process PNG screenshots with Sharp and an SVG "browser chrome" overlay. Perfect for CI pipelines.

## Quick Start

```bash
npm install
npm run demo  # Takes screenshot of example.com and frames it automatically
```

This creates:
- `screenshots/raw/example.png` - Raw screenshot from Playwright
- `screenshots/framed/example.png` - Framed screenshot with browser chrome

## Project Structure

```
src/
├── take-screenshot.ts    # Integrated screenshot capture + framing
├── frame-screenshots.ts  # Batch framing of existing screenshots
└── test.ts              # Test utilities
browser-chrome.svg       # Browser chrome template (previewable)
dist/                    # Compiled JavaScript
screenshots/            # Output directory
├── raw/                # Raw screenshots
└── framed/             # Framed screenshots
```

## Usage

### Automated Capture + Framing (Recommended)

```bash
npm run capture  # Takes screenshot and frames it in one step
```

### Manual Batch Processing

1. Place your raw PNG screenshots in `screenshots/raw/`
2. Run: `npm run frame`
3. Find framed screenshots in `screenshots/framed/`

## Setup

```bash
npm install
npx playwright install chromium  # Install browser for Playwright
```

## Scripts

- `npm run build` - Compile TypeScript from `src/` to `dist/`
- `npm run capture` - Take screenshot with Playwright and frame it
- `npm run frame` - Frame existing screenshots in batch
- `npm run demo` - Same as `capture` (convenience alias)
- `npm run test` - Run test utilities

## Features

- ✅ Adds macOS-style browser chrome (traffic light buttons + address bar)
- ✅ Works with any PNG screenshot source
- ✅ Pure Node.js pipeline - no HTML harness required
- ✅ Output ready for documentation tools like Notion/Outline
- ✅ TypeScript support
- ✅ Playwright integration for automated screenshot capture

## Customization

**Browser Chrome Design:**
- Edit `browser-chrome.svg` to modify the chrome appearance
- Preview the SVG file directly in your browser
- Placeholders like `{{WIDTH}}` are automatically replaced at runtime

**Layout Constants:**
Edit the constants in `src/frame-screenshots.ts` or `src/take-screenshot.ts`:
- `pad`: Padding around screenshot (default: 24px)
- `chromeH`: Browser bar height (default: 44px)
- `radius`: Corner radius (default: 16px)

Colors are hardcoded for a clean macOS look but can be modified in the SVG file.

## CI Integration

Perfect for CI pipelines - single step process:

```yaml
- name: Capture and frame screenshots
  run: npm run capture

- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    path: screenshots/framed/
```