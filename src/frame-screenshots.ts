import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const inDir = "screenshots/raw";
const outDir = "screenshots/framed";
await fs.mkdir(outDir, { recursive: true });

const pad = 24;
const chromeH = 44; // browser top bar height
const radius = 16;

const files = (await fs.readdir(inDir)).filter(f => f.endsWith(".png"));

for (const f of files) {
  const inputPath = path.join(inDir, f);
  const outputPath = path.join(outDir, f);

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