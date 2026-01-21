# Sharp Browser Frame

Post-process PNG screenshots with Sharp and an SVG "browser chrome" overlay. Perfect for CI pipelines.

## Quick Start

```bash
# Using Make (recommended)
make install  # Install dependencies and Playwright browser
make demo     # Takes screenshot of example.com and frames it automatically

# Or using npm/pnpm
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
browser-frame.svg       # Browser chrome template (previewable)
dist/                    # Compiled JavaScript
screenshots/            # Output directory
├── raw/                # Raw screenshots
└── framed/             # Framed screenshots
```

## Usage

### Automated Capture + Framing (Recommended)

```bash
pnpm run capture  # Takes screenshot and frames it in one step
```

### Manual Batch Processing

1. Place your raw PNG screenshots in `screenshots/raw/`
2. Run: `pnpm run frame`
3. Find framed screenshots in `screenshots/framed/`

## Setup

```bash
pnpm install
pnpm exec playwright install chromium  # Install browser for Playwright
```

## Scripts

### Using Make (recommended)
```bash
make all      # Build TypeScript (default)
make build    # Compile TypeScript from `src/` to `dist/`
make capture  # Take screenshot with Playwright and frame it
make frame    # Frame existing screenshots in batch
make demo     # Same as `capture` (convenience alias)
make test     # Run test utilities
make clean    # Remove build artifacts and screenshots
make help     # Show all available targets
```

### Using npm/pnpm
- `npm run build` - Compile TypeScript from `src/` to `dist/`
- `npm run capture` - Take screenshot with Playwright and frame it
- `npm run frame` - Frame existing screenshots in batch
- `npm run demo` - Same as `capture` (convenience alias)
- `npm run test` - Run test utilities

## Features

- ✅ **Detailed macOS browser frame** with realistic chrome, shadows, and UI elements
- ✅ **Fully customizable SVG** - edit `browser-frame.svg` for different styles
- ✅ Works with any PNG screenshot source
- ✅ Pure Node.js pipeline - no HTML harness required
- ✅ Output ready for documentation tools like Notion/Outline
- ✅ TypeScript support
- ✅ Playwright integration for automated screenshot capture

## Customization

**Browser Frame Design:**
- Edit `browser-frame.svg` to modify the chrome appearance and styling
- Preview the SVG file directly in your browser (currently set to 800×500)
- The `{{PAGE_CONTENT}}` placeholder gets replaced with your screenshot at runtime
- The SVG automatically resizes to fit your screenshots

**Programmatic Customization:**
The `frameScreenshot` function accepts optional parameters:

```typescript
import { frameScreenshot } from './src/take-screenshot';

await frameScreenshot('input.png', 'output.png', {
  width: 1920,        // Override screenshot width (default: auto-detect)
  height: 1080,       // Override screenshot height (default: auto-detect)
  pad: 40,            // Padding around content (default: 40px)
  chromeH: 78,       // Browser bar height (default: 78px)
});
```

**Layout Constants:**
Default values in `src/take-screenshot.ts`:
- `pad`: Padding around screenshot (default: 40px, matches SVG template)
- `chromeH`: Browser bar height (default: 78px, matches SVG template)

**Advanced Customization:**
For different frame styles, you can:
1. Edit the SVG directly with any vector graphics editor
2. Replace `browser-frame.svg` with your own design
3. Modify colors, add/remove UI elements, change the overall style
4. Pass custom dimensions and padding via the options parameter

## CI Integration

Perfect for CI pipelines - single step process:

```yaml
- name: Capture and frame screenshots
  run: pnpm run capture

- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    path: screenshots/framed/
```