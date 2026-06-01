import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf"); // 3 pages
const URL = "http://localhost:4173/tool/reorder";

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
  logHeader(`REORDER TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/pdf-reorder-${vp.name}-${Date.now()}`;
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
    const resp = await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    if (!resp.ok()) {
      pass = false;
      failures.push(`page did not load ok (${resp.status()})`);
    }

    const fi = page.locator('input[type="file"]').first();
    await fi.waitFor({ state: "attached", timeout: 10000 });
    await fi.setInputFiles([PDF]);

    // Wait for thumbnails
    let thumbsRendered = false;
    for (let t = 0; t < 20000; t += 1000) {
      await page.waitForTimeout(1000);
      const imgCount = await page.locator('img[alt=""]').count();
      if (imgCount >= 3) {
        thumbsRendered = true;
        console.log(`[ui] thumbnails rendered after ${t + 1000}ms (imgCount=${imgCount})`);
        break;
      }
    }
    if (!thumbsRendered) {
      pass = false;
      failures.push("thumbnails never rendered");
    }

    // CASE 1: apply without reordering (3 pages in original order)
    logHeader(`  CASE 1: apply as-is (3 pages)`);
    let applyBtn = page.getByRole("button", { name: /Apply & download/i });
    let disabled = await applyBtn.isDisabled();
    console.log(`[ui] apply btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("apply button disabled when expected enabled");
    }

    let [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      applyBtn.click(),
    ]);
    let suggested = download.suggestedFilename();
    let outPath = path.join(downloadDir, `case1-${suggested}`);
    await download.saveAs(outPath);
    let stat = fs.statSync(outPath);
    console.log(`[download] file=${suggested} size=${stat.size}B`);

    if (!suggested.endsWith(".pdf")) {
      pass = false;
      failures.push("case1: filename not .pdf");
    }

    let bytes = fs.readFileSync(outPath);
    let doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    let pages = doc.getPages();
    console.log(`[verify] case1 page count=${pages.length}`);
    if (pages.length !== 3) {
      pass = false;
      failures.push(`case1: page count ${pages.length} (expected 3)`);
    }

    let toast = await page
      .locator("text=/Saved with \\d+ pages|Working/")
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    console.log(`[ui] case1 toast=${toast}`);

    // CASE 2: remove page 2 (✕ on second row), then apply
    logHeader(`  CASE 2: remove page 2, then apply (2 pages)`);
    const removeBtns = page.getByRole("button", { name: "Remove page" });
    const removeCount = await removeBtns.count();
    console.log(`[ui] remove buttons=${removeCount}`);
    if (removeCount < 3) {
      pass = false;
      failures.push(`expected 3 remove buttons, got ${removeCount}`);
    }

    // Remove the second item (page index 1)
    await removeBtns.nth(1).click();
    await page.waitForTimeout(500);
    console.log(`[ui] clicked remove on page 2`);

    const remainingItems = await page.locator('img[alt=""]').count();
    console.log(`[ui] remaining items=${remainingItems}`);
    if (remainingItems !== 2) {
      pass = false;
      failures.push(`expected 2 items after remove, got ${remainingItems}`);
    }

    applyBtn = page.getByRole("button", { name: /Apply & download/i });
    disabled = await applyBtn.isDisabled();
    console.log(`[ui] apply btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("apply button disabled after remove");
    }

    [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      applyBtn.click(),
    ]);
    suggested = download.suggestedFilename();
    outPath = path.join(downloadDir, `case2-${suggested}`);
    await download.saveAs(outPath);
    stat = fs.statSync(outPath);
    console.log(`[download] file=${suggested} size=${stat.size}B`);

    bytes = fs.readFileSync(outPath);
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    pages = doc.getPages();
    console.log(`[verify] case2 page count=${pages.length}`);
    if (pages.length !== 2) {
      pass = false;
      failures.push(`case2: page count ${pages.length} (expected 2 after remove)`);
    }

    toast = await page
      .locator("text=/Saved with \\d+ pages|Working/")
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    console.log(`[ui] case2 toast=${toast}`);

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
