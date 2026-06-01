import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const [name, vp, dark] of [
    ["desktop-light", { width: 1280, height: 900 }, false],
    ["desktop-dark", { width: 1280, height: 900 }, true],
    ["mobile-light", { width: 390, height: 844 }, false],
  ]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto("http://localhost:4173/", { waitUntil: "domcontentloaded" });
    if (dark) {
      // Use the next-themes localStorage to set the theme
      await page.addInitScript(() => {
        localStorage.setItem("pdf-toolkit-theme", "dark");
      });
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      });
    }
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("pdf-toolkit:download", { detail: { filename: "merged-3-pages.pdf" } }));
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/tmp/modal-${name}.png` });
    await ctx.close();
  }
  await browser.close();
  console.log("done");
})();
