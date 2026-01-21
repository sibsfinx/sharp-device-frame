// Create a test PNG to verify the framing works
import sharp from "sharp";
import fs from "node:fs/promises";

await fs.mkdir("screenshots/raw", { recursive: true });

// Create a simple test screenshot (400x300 white with some text)
const testSvg = Buffer.from(`
  <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="white"/>
    <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="24" fill="#333">
      Test Screenshot
    </text>
  </svg>
`);

await sharp(testSvg)
  .png()
  .toFile("screenshots/raw/test.png");

console.log("Created test screenshot in screenshots/raw/test.png");
console.log("Run 'pnpm run frame' to process it!");