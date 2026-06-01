import { chromium, devices } from "playwright";
import path from "node:path";
import fs from "node:fs";

const URL = "http://localhost:4173";
const OUT = "/Users/moayaan.eth/pdf-toolkit/screenshots";
fs.mkdirSync(OUT, { recursive: true });

// 18 tool ids we want to capture
const TOOL_IDS = [
  "merge", "split", "rotate", "reorder",
  "pdf-to-images", "images-to-pdf", "extract-text", "html-to-pdf",
  "page-numbers", "watermark", "metadata", "forms",
  "crop", "extract-pages", "batch", "viewer", "compare", "ocr",
];

const DESKTOP = { width: 1280, height: 832 };
const MOBILE = { width: 390, height: 844 };

async function shoot(page, name) {
  const file = path.join(OUT, name + ".png");
  await page.screenshot({ path: file, fullPage: true });
  console.log("  saved", name);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ===== DESKTOP =====
  console.log("== desktop ==");
  const dctx = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 2 });
  const dpage = await dctx.newPage();
  await dpage.goto(URL, { waitUntil: "networkidle" });
  await dpage.waitForTimeout(800);
  await shoot(dpage, "desktop-01-home");

  // Tool page samples (one per category for variety)
  await dpage.goto(`${URL}/tool/merge`, { waitUntil: "networkidle" });
  await dpage.waitForTimeout(600);
  await shoot(dpage, "desktop-02-tool-merge");

  await dpage.goto(`${URL}/tool/html-to-pdf`, { waitUntil: "networkidle" });
  await dpage.waitForTimeout(600);
  await shoot(dpage, "desktop-03-tool-html-to-pdf");

  await dpage.goto(`${URL}/tool/ocr`, { waitUntil: "networkidle" });
  await dpage.waitForTimeout(600);
  await shoot(dpage, "desktop-04-tool-ocr");

  // Dark mode home for contrast
  await dpage.evaluate(() => document.documentElement.classList.add("dark"));
  await dpage.goto(URL, { waitUntil: "networkidle" });
  await dpage.waitForTimeout(800);
  await shoot(dpage, "desktop-05-home-dark");

  // All 18 tool cards in a scrollable view
  await dpage.goto(URL, { waitUntil: "networkidle" });
  await dpage.evaluate(() => {
    const grid = document.querySelector('[class*="grid"]');
    grid?.scrollIntoView();
  });
  await dpage.waitForTimeout(400);
  await dpage.evaluate(() => window.scrollTo(0, 1400));
  await dpage.waitForTimeout(400);
  await shoot(dpage, "desktop-06-tool-grid");

  // FAQ section
  await dpage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await dpage.waitForTimeout(400);
  await shoot(dpage, "desktop-07-faq");

  await dctx.close();

  // ===== MOBILE =====
  console.log("== mobile ==");
  const mctx = await browser.newContext({ ...devices["iPhone 15"], deviceScaleFactor: 2 });
  const mpage = await mctx.newPage();
  await mpage.goto(URL, { waitUntil: "networkidle" });
  await mpage.waitForTimeout(800);
  await shoot(mpage, "mobile-01-home");

  await mpage.goto(`${URL}/tool/merge`, { waitUntil: "networkidle" });
  await mpage.waitForTimeout(600);
  await shoot(mpage, "mobile-02-tool-merge");

  await mpage.goto(`${URL}/tool/forms`, { waitUntil: "networkidle" });
  await mpage.waitForTimeout(600);
  await shoot(mpage, "mobile-03-tool-forms");

  await mctx.close();

  // ===== OG IMAGE SAMPLES =====
  console.log("== og images ==");
  const octx = await browser.newContext({ viewport: { width: 1200, height: 630 } });
  const opage = await octx.newPage();
  for (const id of ["merge", "ocr", "html-to-pdf"]) {
    const resp = await opage.goto(`${URL}/tool/${id}/opengraph-image`, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (resp?.status() === 200) {
      const buf = await resp.body();
      const out = path.join(OUT, `og-${id}.png`);
      fs.writeFileSync(out, buf);
      console.log("  saved og-" + id);
    } else {
      console.log("  SKIP og-" + id, resp?.status());
    }
  }
  await octx.close();

  await browser.close();
  console.log("\nDone. Files in", OUT);
})();
