import { chromium } from "playwright";
import path from "node:path";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf");
const URL_PAGE = "http://localhost:4173/tool/viewer";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(URL_PAGE, { waitUntil: "networkidle" });
  const fi = page.locator('input[type="file"]').first();
  await fi.waitFor({ state: "attached" });
  await fi.setInputFiles([PDF]);
  await page.waitForTimeout(3000);

  // Get all text on page
  const bodyText = await page.locator("body").innerText();
  console.log("BODY TEXT:\n" + bodyText);

  await browser.close();
})();
