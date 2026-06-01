import { chromium } from "playwright";
import path from "node:path";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf");
const URL = "http://localhost:4173/tool/rotate";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  page.on("console", (m) => console.log(`[c.${m.type()}]`, m.text()));
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));

  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  const fi = page.locator('input[type="file"]').first();
  await fi.waitFor({ state: "attached" });
  await fi.setInputFiles([PDF]);
  await page.waitForTimeout(5000);
  await browser.close();
})();
