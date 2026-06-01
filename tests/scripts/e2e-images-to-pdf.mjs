import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const IMG1 = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/test1.png");
const IMG2 = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/test2.png");
const URL_PAGE = "http://localhost:4173/tool/images-to-pdf";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

function logHeader(t) {
  console.log("\n" + "=".repeat(60));
  console.log(t);
  console.log("=".repeat(60));
}

async function runForViewport(vp) {
  logHeader(`IMAGES-TO-PDF TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/img2pdf-${vp.name}-${Date.now()}`;
  fs.mkdirSync(downloadDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    acceptDownloads: true,
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

  let pass = true;
  const failures = [];

  try {
    const resp = await page.goto(URL_PAGE, { waitUntil: "networkidle", timeout: 30000 });
    if (!resp.ok()) {
      pass = false;
      failures.push(`page did not load ok (${resp.status()})`);
    }

    // Upload 2 PNGs
    const fi = page.locator('input[type="file"]').first();
    await fi.waitFor({ state: "attached", timeout: 10000 });
    await fi.setInputFiles([IMG1, IMG2]);
    console.log(`[upload] set 2 images`);

    // Wait for previews
    let previewsRendered = false;
    for (let t = 0; t < 10000; t += 500) {
      await page.waitForTimeout(500);
      const chipCount = await page.locator("text=/test[12]\\.png/").count();
      if (chipCount >= 2) {
        previewsRendered = true;
        console.log(`[ui] chips visible after ${t + 500}ms`);
        break;
      }
    }
    if (!previewsRendered) {
      pass = false;
      failures.push("file chips never appeared");
    }

    // Button label should show "Create PDF (2 pages)"
    const btn = page.getByRole("button", { name: /Create PDF \(\d+ pages\)/i });
    const btnText = await btn.textContent();
    console.log(`[ui] button text=${btnText}`);
    if (!btnText?.includes("2 pages")) {
      pass = false;
      failures.push(`button label wrong: ${btnText}`);
    }

    // Click convert
    const disabled = await btn.isDisabled();
    console.log(`[ui] convert btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("convert button disabled");
    }

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      btn.click(),
    ]);
    const suggested = download.suggestedFilename();
    if (!suggested.endsWith(".pdf")) {
      pass = false;
      failures.push(`filename not .pdf: ${suggested}`);
    }
    const outPath = path.join(downloadDir, suggested);
    await download.saveAs(outPath);
    const stat = fs.statSync(outPath);
    console.log(`[download] file=${suggested} size=${stat.size}B`);

    if (stat.size < 1000) {
      pass = false;
      failures.push(`output too small (${stat.size}B)`);
    }

    // Verify
    const bytes = fs.readFileSync(outPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = doc.getPages();
    console.log(`[verify] page count=${pages.length}`);
    if (pages.length !== 2) {
      pass = false;
      failures.push(`page count ${pages.length} (expected 2)`);
    }

    const toast = await page
      .locator("text=/Created PDF with \\d+ pages|Working/")
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    console.log(`[ui] toast=${toast}`);

    if (vp.name === "mobile") {
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      console.log(`[mobile] horizontal overflow=${overflow}`);
      if (overflow) failures.push("horizontal overflow on mobile");
    }

    const fatal = consoleErrors.filter(
      (e) => !/favicon|404|hydration|downloadable font|Failed to load resource/i.test(e)
    );
    if (fatal.length) {
      console.log(`[console] errors:`);
      fatal.forEach((e) => console.log("  - " + e));
    }
  } catch (e) {
    pass = false;
    failures.push(`exception: ${e.message}`);
    console.log(`[ERROR] ${e.stack || e.message}`);
  } finally {
    await browser.close();
  }

  console.log(`\nRESULT [${vp.name}]: ${pass ? "WORKING" : "NOT WORKING"}`);
  if (!pass) failures.forEach((f) => console.log(`  - ${f}`));
  return { name: vp.name, pass, failures };
}

const results = [];
for (const vp of VIEWPORTS) {
  const r = await runForViewport(vp);
  results.push(r);
}

console.log("\n" + "#".repeat(60));
console.log("FINAL SUMMARY");
console.log("#".repeat(60));
results.forEach((r) => {
  console.log(`${r.name.toUpperCase()}: ${r.pass ? "WORKING" : "NOT WORKING"}`);
  if (!r.pass) r.failures.forEach((f) => console.log(`   - ${f}`));
});
process.exit(results.every((r) => r.pass) ? 0 : 1);
