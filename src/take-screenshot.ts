import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

// Framing constants
const pad = 24;
const chromeH = 44; // browser top bar height
const radius = 16;

async function frameScreenshot(inputPath: string, outputPath: string) {
  const img = sharp(inputPath);
  const { width = 0, height = 0 } = await img.metadata();

  const W = width + pad * 2;
  const H = height + pad * 2 + chromeH;

  // Read and customize the SVG template
  const svgTemplate = await fs.readFile('browser-chrome.svg', 'utf8');
  const chromeSvgString = svgTemplate
    .replace(/{{WIDTH}}/g, W.toString())
    .replace(/{{CHROME_HEIGHT}}/g, chromeH.toString())
    .replace(/{{RADIUS}}/g, radius.toString())
    .replace(/{{CHROME_CENTER}}/g, Math.floor(chromeH/2).toString())
    .replace(/{{ADDRESS_BAR_Y}}/g, (Math.floor(chromeH/2)-8).toString())
    .replace(/{{ADDRESS_BAR_WIDTH}}/g, Math.min(520, W-110).toString());
  const chromeSvg = Buffer.from(chromeSvgString);

  // Background canvas
  const canvas = sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: "#F7F8FA"
    }
  });

  await canvas
    .composite([
      { input: chromeSvg, top: 0, left: 0 },
      { input: await img.png().toBuffer(), top: pad + chromeH, left: pad }
    ])
    .png()
    .toFile(outputPath);
}

async function takeScreenshot() {
  // Ensure directories exist
  await fs.mkdir('screenshots/raw', { recursive: true });
  await fs.mkdir('screenshots/framed', { recursive: true });

  // Launch browser
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to a page (using example.com for demo)
    await page.goto('https://example.com');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    const filename = 'example.png';
    const rawPath = path.join('screenshots/raw', filename);
    const framedPath = path.join('screenshots/framed', filename);

    // Take raw screenshot
    await page.screenshot({
      path: rawPath,
      fullPage: false // Set to true if you want full page
    });

    console.log('✅ Raw screenshot saved to', rawPath);

    // Frame the screenshot
    await frameScreenshot(rawPath, framedPath);
    console.log('✅ Framed screenshot saved to', framedPath);

  } catch (error) {
    console.error('❌ Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  takeScreenshot();
}