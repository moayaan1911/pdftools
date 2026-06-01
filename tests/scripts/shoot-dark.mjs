import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Pre-set localStorage via init script (runs before any page scripts)
  await page.addInitScript(() => {
    localStorage.setItem("pdf-toolkit-theme", "dark");
  });

  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Check html class
  const htmlClass = await page.evaluate(() => document.documentElement.className);
  console.log("html class:", htmlClass);
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log("body bg:", bodyBg);

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("pdf-toolkit:download", { detail: { filename: "merged-3-pages.pdf" } }));
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: "/tmp/modal-dark-v2.png" });
  await browser.close();
})();
