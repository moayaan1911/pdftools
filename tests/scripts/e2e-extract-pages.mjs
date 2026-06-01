import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf"); // 3 pages
const URL_PAGE = "http://localhost:4173/tool/extract-pages";

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
  logHeader(`EXTRACT-PAGES TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/extract-pages-${vp.name}-${Date.now()}`;
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

    // Upload
    const fi = page.locator('input[type="file"]').first();
    await fi.waitFor({ state: "attached", timeout: 10000 });
    await fi.setInputFiles([PDF]);

    // Wait for thumbnails
    let thumbsReady = false;
    for (let t = 0; t < 15000; t += 500) {
      await page.waitForTimeout(500);
      const cnt = await page.locator("img[alt='']").count();
      if (cnt >= 3) {
        thumbsReady = true;
        console.log(`[ui] thumbnails ready after ${t + 500}ms`);
        break;
      }
    }
    if (!thumbsReady) {
      pass = false;
      failures.push("thumbnails never rendered");
    }

    // CASE 1: use range input "1, 3" → should select pages 1 and 3
    logHeader(`  CASE 1: range "1, 3" → 2 pages selected`);
    const rangeInput = page.getByPlaceholder("e.g. 1-3, 5, 7");
    await rangeInput.fill("1, 3");
    await page.waitForTimeout(200);
    const selectBtn = page.getByRole("button", { name: /^Select$/ });
    await selectBtn.click();
    await page.waitForTimeout(300);
    console.log(`[ui] range applied`);

    // Verify "2 selected"
    const selectedTxt = await page.locator("text=/^\\d+ selected$/").first().textContent().catch(() => null);
    console.log(`[ui] selection text: ${selectedTxt}`);
    if (selectedTxt !== "2 selected") {
      pass = false;
      failures.push(`expected "2 selected", got "${selectedTxt}"`);
    }

    const extractBtn = page.getByRole("button", { name: /Extract \d+ page/i });
    const disabled = await extractBtn.isDisabled();
    console.log(`[ui] extract btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("case1: extract button disabled");
    }

    let [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      extractBtn.click(),
    ]);
    let suggested = download.suggestedFilename();
    let outPath = path.join(downloadDir, `case1-${suggested}`);
    await download.saveAs(outPath);
    let stat = fs.statSync(outPath);
    console.log(`[download] case1 file=${suggested} size=${stat.size}B`);

    let bytes = fs.readFileSync(outPath);
    let doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    let pages = doc.getPages();
    console.log(`[verify] case1 page count=${pages.length}`);
    if (pages.length !== 2) {
      pass = false;
      failures.push(`case1: page count ${pages.length} (expected 2)`);
    }

    let toast = await page
      .locator("text=/Extracted \\d+ pages|Working/")
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    console.log(`[ui] case1 toast=${toast}`);

    // CASE 2: click thumbnails individually  -  first deselect all 3 from case 1, then click page 2 only
    logHeader(`  CASE 2: click page 2 thumbnail only → 1 page selected`);
    // Re-upload to reset (note: app keeps old selection across re-upload, so manually deselect all)
    const thumbBtns = page.locator('button:has(img[alt=""])');
    const thumbCount = await thumbBtns.count();
    console.log(`[ui] thumbnail buttons=${thumbCount}`);
    if (thumbCount < 3) {
      pass = false;
      failures.push(`expected 3 thumbnails, got ${thumbCount}`);
    }

    // Deselect all currently selected (was 2 from case 1)
    // Strategy: click each thumbnail to TOGGLE  -  clicks the ones that ARE selected, unselecting them
    // We don't know which are selected, so just click each one twice (toggle on then off) for safety
    // Actually simpler: click 3 times to deselect, then 1 click to select just nth(1).
    // Cleanest: directly read state via a known-pattern. Let's just click each in turn  -  if it was selected it deselects, if not it selects.
    // After clicking all 3, all should be in opposite state. Then click nth(1) again to flip back.
    // Simpler: just click each one to know end state. Click 0 (flip), click 0 (flip back), etc  -  then click 1 once.
    // But this is getting complex. Best: select all 3 first, then unselect by clicking again. But that takes 6 clicks.
    // Cleanest: click each thumbnail, then click each again  -  guarantees same starting state.
    // Actually: since case 1 selected 0 and 2 (pages 1, 3 in 0-indexed), let me just deselect those two explicitly:
    await thumbBtns.nth(0).click(); // toggle off
    await page.waitForTimeout(100);
    await thumbBtns.nth(2).click(); // toggle off
    await page.waitForTimeout(100);
    // Now all 3 are unselected. Click thumb nth(1) to select only page 2.
    await thumbBtns.nth(1).click();
    await page.waitForTimeout(300);
    const selectedTxt2 = await page.locator("text=/^\\d+ selected$/").first().textContent().catch(() => null);
    console.log(`[ui] case2 selection: ${selectedTxt2}`);
    if (selectedTxt2 !== "1 selected") {
      pass = false;
      failures.push(`case2: expected "1 selected", got "${selectedTxt2}"`);
    }

    [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      page.getByRole("button", { name: /Extract \d+ page/i }).click(),
    ]);
    suggested = download.suggestedFilename();
    outPath = path.join(downloadDir, `case2-${suggested}`);
    await download.saveAs(outPath);
    stat = fs.statSync(outPath);
    console.log(`[download] case2 file=${suggested} size=${stat.size}B`);

    bytes = fs.readFileSync(outPath);
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    pages = doc.getPages();
    console.log(`[verify] case2 page count=${pages.length}`);
    if (pages.length !== 1) {
      pass = false;
      failures.push(`case2: page count ${pages.length} (expected 1)`);
    }

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
