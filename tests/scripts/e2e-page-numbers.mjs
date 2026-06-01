import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf"); // 3 pages
const URL_PAGE = "http://localhost:4173/tool/page-numbers";

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
  logHeader(`PAGE-NUMBERS TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/page-num-${vp.name}-${Date.now()}`;
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

    // Wait for "3 pages detected" text
    let detected = false;
    for (let t = 0; t < 15000; t += 500) {
      await page.waitForTimeout(500);
      const txt = await page.locator("text=/\\d+ pages? detected/").first().textContent().catch(() => null);
      if (txt && /3 pages? detected/.test(txt)) {
        detected = true;
        console.log(`[ui] page count detected: "${txt}" after ${t + 500}ms`);
        break;
      }
    }
    if (!detected) {
      pass = false;
      failures.push("'3 pages detected' never appeared");
    }

    // CASE 1: default format "Page 1", start=1
    logHeader(`  CASE 1: format='Page 1'`);
    const applyBtn = page.getByRole("button", { name: /Apply & download/i });
    const disabled = await applyBtn.isDisabled();
    console.log(`[ui] apply btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("case1: apply button disabled");
    }

    let [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      applyBtn.click(),
    ]);
    let suggested = download.suggestedFilename();
    if (!suggested.endsWith(".pdf")) {
      pass = false;
      failures.push(`case1: filename not .pdf: ${suggested}`);
    }
    let outPath = path.join(downloadDir, `case1-${suggested}`);
    await download.saveAs(outPath);
    let stat = fs.statSync(outPath);
    console.log(`[download] case1 file=${suggested} size=${stat.size}B`);

    let bytes = fs.readFileSync(outPath);
    let doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    let pages = doc.getPages();
    console.log(`[verify] case1 page count=${pages.length}`);
    if (pages.length !== 3) {
      pass = false;
      failures.push(`case1: page count ${pages.length} (expected 3)`);
    }

    let toast = await page
      .locator("text=/Page numbers added|Working/")
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    console.log(`[ui] case1 toast=${toast}`);

    // CASE 2: change format to "1 / N" and startAt=5
    logHeader(`  CASE 2: format='1 / N', startAt=5`);
    const formatSelect = page.locator("select").first();
    await formatSelect.selectOption("1 / N");
    await page.waitForTimeout(300);
    console.log(`[ui] format changed to '1 / N'`);

    const startInput = page.locator('input[type="number"]').first();
    await startInput.fill("5");
    await page.waitForTimeout(300);
    console.log(`[ui] startAt=5`);

    [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      applyBtn.click(),
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
    if (pages.length !== 3) {
      pass = false;
      failures.push(`case2: page count ${pages.length} (expected 3)`);
    }

    // CASE 3: try a different position
    logHeader(`  CASE 3: position=top-right`);
    await page.getByRole("button", { name: /Top R/ }).click();
    await page.waitForTimeout(300);
    [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      applyBtn.click(),
    ]);
    suggested = download.suggestedFilename();
    outPath = path.join(downloadDir, `case3-${suggested}`);
    await download.saveAs(outPath);
    stat = fs.statSync(outPath);
    console.log(`[download] case3 file=${suggested} size=${stat.size}B`);
    if (stat.size < 1000) {
      pass = false;
      failures.push(`case3: output too small (${stat.size}B)`);
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
