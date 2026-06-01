import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Full page screenshot
  await page.screenshot({ path: "/tmp/hero-desktop.png", fullPage: false });
  console.log("desktop full screenshot saved");

  // Move mouse to test 3D tilt
  const card = page.locator('a[href="/tool/merge"]').first();
  const box = await card.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/hero-desktop-hover.png" });
    console.log("desktop with hover saved");
  }

  // Test mobile viewport
  await ctx.close();
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page2 = await ctx2.newPage();
  await page2.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await page2.waitForTimeout(1500);
  await page2.screenshot({ path: "/tmp/hero-mobile.png" });
  console.log("mobile screenshot saved");

  await browser.close();
})();
