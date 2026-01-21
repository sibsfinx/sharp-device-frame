import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

// Framing constants - must match browser-frame.svg template
const DEFAULT_PAD = 40; // Padding around content (matches SVG template)
const DEFAULT_CHROME_H = 40; // Browser top bar height (matches SVG: 80 - 40 = 40)
const DEFAULT_RADIUS = 16;

interface FrameOptions {
  width?: number;
  height?: number;
  pad?: number;
  chromeH?: number;
  pageTitle?: string;
}

async function frameScreenshot(
  inputPath: string,
  outputPath: string,
  options: FrameOptions = {}
) {
  const {
    width: providedWidth,
    height: providedHeight,
    pad = DEFAULT_PAD,
    chromeH = DEFAULT_CHROME_H,
    pageTitle = '',
  } = options;

  const img = sharp(inputPath);
  const metadata = await img.metadata();
  
  // Use provided dimensions or read from image metadata
  const width = providedWidth ?? metadata.width ?? 0;
  const height = providedHeight ?? metadata.height ?? 0;

  // Calculate frame dimensions (content + padding + chrome)
  const frameWidth = width + pad * 2;
  const frameHeight = height + pad * 2 + chromeH;

  // Shadow filter parameters: offset dx="7" dy="14", blur stdDeviation="15"
  // Blur margin needed: ~3 * stdDeviation = 45px
  const shadowOffsetX = 7;
  const shadowOffsetY = 14;
  const shadowBlurMargin = 45; // 3 * stdDeviation for Gaussian blur

  // Calculate canvas dimensions with shadow margin
  const canvasWidth = frameWidth + shadowBlurMargin * 2;
  const canvasHeight = frameHeight + shadowBlurMargin * 2;

  // Read and customize the SVG template
  const svgTemplate = await fs.readFile('browser-frame.svg', 'utf8');

  // Convert screenshot to base64 for embedding in SVG
  const screenshotBuffer = await img.png().toBuffer();
  const screenshotBase64 = screenshotBuffer.toString('base64');
  const screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

  // Create image element to replace placeholder (account for shadow margin)
  const imageElement = `<image x="${pad + shadowBlurMargin}" y="${pad + shadowBlurMargin + chromeH}" width="${width}" height="${height}" href="${screenshotDataUrl}"/>`;
  
  // Format title for display
  const displayText = pageTitle && pageTitle.trim() ? pageTitle : 'Untitled Page';
  
  const frameSvgString = svgTemplate
    .replace(/width="1520"/g, `width="${canvasWidth}"`)
    .replace(/height="1065"/g, `height="${canvasHeight}"`)
    .replace(/viewBox="0 0 1520 1065"/g, `viewBox="0 0 ${canvasWidth} ${canvasHeight}"`)
    // Update clip paths - account for shadow margin offset
    .replace(/width="1520" height="1065"/g, `width="${canvasWidth}" height="${canvasHeight}"`)
    .replace(/x="40" y="40" width="1440" height="985"/g, `x="${pad + shadowBlurMargin}" y="${pad + shadowBlurMargin}" width="${width}" height="${height + chromeH}"`)
    // Update filter bounds - ensure full shadow is visible (offset + blur margin)
    .replace(/x="17" y="24" width="1500" height="1045"/g, 
             `x="${pad + shadowBlurMargin - shadowBlurMargin}" y="${pad + shadowBlurMargin - shadowBlurMargin}" width="${width + shadowOffsetX + shadowBlurMargin * 2}" height="${height + chromeH + shadowOffsetY + shadowBlurMargin * 2}"`)
    // Replace page content placeholder with actual image
    .replace(/{{PAGE_CONTENT}}/g, imageElement)
    // Update chrome background path - rounded top corners (account for shadow margin)
    .replace(/M40 48C40 43.5817 43.5817 40 48 40H1472C1476.42 40 1480 43.5817 1480 48V80H40V48Z/g,
             `M${pad + shadowBlurMargin} ${pad + shadowBlurMargin + 8}C${pad + shadowBlurMargin} ${pad + shadowBlurMargin + 3.5817} ${pad + shadowBlurMargin + 3.5817} ${pad + shadowBlurMargin} ${pad + shadowBlurMargin + 8} ${pad + shadowBlurMargin}H${frameWidth - pad - 8 + shadowBlurMargin}C${frameWidth - pad - 3.5817 + shadowBlurMargin} ${pad + shadowBlurMargin} ${frameWidth - pad + shadowBlurMargin} ${pad + shadowBlurMargin + 3.5817} ${frameWidth - pad + shadowBlurMargin} ${pad + shadowBlurMargin + 8}V${pad + shadowBlurMargin + chromeH}H${pad + shadowBlurMargin}V${pad + shadowBlurMargin + 8}Z`)
    // Update white background rects - account for shadow margin
    .replace(/x="40" y="40" width="1440" height="985" rx="16"/g, `x="${pad + shadowBlurMargin}" y="${pad + shadowBlurMargin}" width="${width}" height="${height + chromeH}" rx="16"`)
    .replace(/x="40" y="80" width="1440" height="945"/g, `x="${pad + shadowBlurMargin}" y="${pad + shadowBlurMargin + chromeH}" width="${width}" height="${height}"`)
    // Update traffic light circles position (account for shadow margin)
    .replace(/cx="62" cy="60"/g, `cx="${pad + shadowBlurMargin + 22}" cy="${pad + shadowBlurMargin + 20}"`)
    .replace(/cx="82" cy="60"/g, `cx="${pad + shadowBlurMargin + 42}" cy="${pad + shadowBlurMargin + 20}"`)
    .replace(/cx="102" cy="60"/g, `cx="${pad + shadowBlurMargin + 62}" cy="${pad + shadowBlurMargin + 20}"`);

  const frameSvg = Buffer.from(frameSvgString);

  // Convert SVG to PNG
  await sharp(frameSvg)
    .png()
    .toFile(outputPath);
}

async function takeScreenshot(url?: string) {
  // Ensure directories exist
  await fs.mkdir('screenshots/raw', { recursive: true });
  await fs.mkdir('screenshots/framed', { recursive: true });

  // Launch browser
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to a page
    const targetUrl = url || 'https://example.com';
    await page.goto(targetUrl);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Get page title
    const pageTitle = await page.title();

    // Generate filename from title or use default
    const safeTitle = pageTitle.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
    const filename = safeTitle || 'screenshot';
    const finalFilename = `${filename}.png`;
    const rawPath = path.join('screenshots/raw', finalFilename);
    const framedPath = path.join('screenshots/framed', finalFilename);

    // Take raw screenshot
    await page.screenshot({
      path: rawPath,
      fullPage: false // Set to true if you want full page
    });

    console.log('✅ Raw screenshot saved to', rawPath);
    console.log('📄 Page:', pageTitle);

    // Frame the screenshot with page metadata
    await frameScreenshot(rawPath, framedPath, {
      pageTitle,
    });
    console.log('✅ Framed screenshot saved to', framedPath);

  } catch (error) {
    console.error('❌ Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
}

// Export for use in other modules
export { frameScreenshot, type FrameOptions };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2] || 'https://thesecatsdonotexist.com/';
  takeScreenshot(url);
}