import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const inDir = "screenshots/raw";
const outDir = "screenshots/framed";
await fs.mkdir(outDir, { recursive: true });

const pad = 40;
const chromeH = 40; // browser top bar height

const files = (await fs.readdir(inDir)).filter(f => f.endsWith(".png"));

for (const f of files) {
  const inputPath = path.join(inDir, f);
  const outputPath = path.join(outDir, f);

  const img = sharp(inputPath);
  const { width = 0, height = 0 } = await img.metadata();

  // Calculate frame dimensions (content + padding + chrome)
  const frameWidth = width + pad * 2;
  const frameHeight = height + pad * 2 + chromeH;

  // Shadow filter parameters: offset dx="7" dy="14", blur stdDeviation="15"
  // Blur margin needed: ~3 * stdDeviation = 45px
  const shadowOffsetX = 7;
  const shadowOffsetY = 14;
  const shadowBlurMargin = 45; // 3 * stdDeviation for Gaussian blur

  // Read and customize the SVG template
  const svgTemplate = await fs.readFile('browser-frame.svg', 'utf8');

  // Create image element to replace placeholder (screenshot will be composited separately)
  // Position accounts for shadow margin
  const imageElement = `<image x="${pad + shadowBlurMargin}" y="${pad + shadowBlurMargin + chromeH}" width="${width}" height="${height}" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jzyr5gAAAABJRU5ErkJggg=="/>`;


  // Calculate canvas dimensions with shadow margin
  const canvasWidth = frameWidth + shadowBlurMargin * 2;
  const canvasHeight = frameHeight + shadowBlurMargin * 2;

  const frameSvgString = svgTemplate
    .replace(/width="1520"/g, `width="${canvasWidth}"`)
    .replace(/height="1065"/g, `height="${canvasHeight}"`)
    .replace(/viewBox="0 0 1520 1065"/g, `viewBox="0 0 ${canvasWidth} ${canvasHeight}"`)
    // Update clip paths - account for shadow margin offset
    .replace(/width="1520" height="1065"/g, `width="${canvasWidth}" height="${canvasHeight}"`)
    .replace(/x="40" y="40" width="1440" height="985"/g, `x="${pad + shadowBlurMargin}" y="${pad + shadowBlurMargin}" width="${width}" height="${height + chromeH}"`)
    // Update white background rects - account for shadow margin
    .replace(/x="40" y="40" width="1440" height="985" rx="16"/g, `x="${pad + shadowBlurMargin}" y="${pad + shadowBlurMargin}" width="${width}" height="${height + chromeH}" rx="16"`)
    .replace(/x="40" y="80" width="1440" height="945"/g, `x="${pad + shadowBlurMargin}" y="${pad + shadowBlurMargin + chromeH}" width="${width}" height="${height}"`)
    // Update filter bounds - ensure full shadow is visible (offset + blur margin)
    // Filter needs to cover: frame bounds + offset + blur margin on all sides
    // Account for shadow margin offset in SVG coordinates
    .replace(/x="17" y="24" width="1500" height="1045"/g, 
             `x="${pad + shadowBlurMargin - shadowBlurMargin}" y="${pad + shadowBlurMargin - shadowBlurMargin}" width="${width + shadowOffsetX + shadowBlurMargin * 2}" height="${height + chromeH + shadowOffsetY + shadowBlurMargin * 2}"`)
    // Replace page content placeholder with actual image
    .replace(/{{PAGE_CONTENT}}/g, imageElement)
    // Update chrome background path - rounded top corners (account for shadow margin)
    .replace(/M40 48C40 43.5817 43.5817 40 48 40H1472C1476.42 40 1480 43.5817 1480 48V80H40V48Z/g,
             `M${pad + shadowBlurMargin} ${pad + shadowBlurMargin + 8}C${pad + shadowBlurMargin} ${pad + shadowBlurMargin + 3.5817} ${pad + shadowBlurMargin + 3.5817} ${pad + shadowBlurMargin} ${pad + shadowBlurMargin + 8} ${pad + shadowBlurMargin}H${frameWidth - pad - 8 + shadowBlurMargin}C${frameWidth - pad - 3.5817 + shadowBlurMargin} ${pad + shadowBlurMargin} ${frameWidth - pad + shadowBlurMargin} ${pad + shadowBlurMargin + 3.5817} ${frameWidth - pad + shadowBlurMargin} ${pad + shadowBlurMargin + 8}V${pad + shadowBlurMargin + chromeH}H${pad + shadowBlurMargin}V${pad + shadowBlurMargin + 8}Z`)
    // Update traffic light circles position (account for shadow margin)
    .replace(/cx="62" cy="60"/g, `cx="${pad + shadowBlurMargin + 22}" cy="${pad + shadowBlurMargin + 20}"`)
    .replace(/cx="82" cy="60"/g, `cx="${pad + shadowBlurMargin + 42}" cy="${pad + shadowBlurMargin + 20}"`)
    .replace(/cx="102" cy="60"/g, `cx="${pad + shadowBlurMargin + 62}" cy="${pad + shadowBlurMargin + 20}"`);

  const frameSvg = Buffer.from(frameSvgString);

  // Background canvas - already calculated above with shadow margin
  const canvas = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: "#F7F8FA"
    }
  });

  // SVG already includes shadow margin, so composite at origin
  // Screenshot is positioned within SVG, so composite separately
  await canvas
    .composite([
      { input: frameSvg, top: 0, left: 0 },
      { input: await img.png().toBuffer(), top: shadowBlurMargin + pad + chromeH, left: shadowBlurMargin + pad }
    ])
    .png()
    .toFile(outputPath);
}