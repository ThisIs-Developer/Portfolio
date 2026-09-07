import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
const font = async (name) =>
  (await readFile(new URL(`assets/fonts/${name}.woff2`, root))).toString(
    "base64",
  );
const [serif, italic, sans] = await Promise.all(
  [
    "instrument-serif-latin-regular",
    "instrument-serif-latin-italic",
    "instrument-sans-latin-variable",
  ].map(font),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
  @font-face{font-family:Display;src:url(data:font/woff2;base64,${serif})}
  @font-face{font-family:Display;src:url(data:font/woff2;base64,${italic});font-style:italic}
  @font-face{font-family:Body;src:url(data:font/woff2;base64,${sans})}
  *{box-sizing:border-box}body{margin:0;background:#f5f4f0;background-image:radial-gradient(#96968c44 .8px,transparent .9px);background-size:28px 28px;color:#1a1a1a;text-align:center;display:flex;flex-direction:column;justify-content:center;height:630px}
  p{font:12px Body,sans-serif;letter-spacing:2px;margin:0 0 30px;color:#666660}h1{font:120px/.95 Display,Georgia,serif;letter-spacing:-3px;margin:0}h2{font:34px/1.4 Display,Georgia,serif;margin:28px 0 0}em{color:#3b5bdb}small{font:12px Body,sans-serif;color:#666660;margin-top:42px}
  </style></head><body><p>SOFTWARE DEVELOPMENT & TEST AUTOMATION</p><h1>Baivab Sarkar</h1><h2>Thoughtful software for <em>real-world problems.</em></h2><small>Open source · Java & JavaScript · West Bengal, India</small></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: fileURLToPath(new URL("assets/social-preview.png", root)),
  });
} finally {
  await browser.close();
}
