import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const [name, vp] of [
    ["desktop", { width: 1280, height: 800 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto("http://localhost:4173/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const header = page.locator("header").first();
    await header.screenshot({ path: `/tmp/header-${name}.png` });
    await page.screenshot({ path: `/tmp/hero-${name}.png`, fullPage: false, clip: { x: 0, y: 0, width: vp.width, height: Math.min(700, vp.height) } });
    await ctx.close();
  }
  await browser.close();
  console.log("done");
})();
