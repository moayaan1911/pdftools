import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf");
const URL_PAGE = "http://localhost:4173/tool/watermark";

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
  logHeader(`WATERMARK TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/watermark-${vp.name}-${Date.now()}`;
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
    const fi = page.locator('input[type="file"][accept="application/pdf"]').first();
    await fi.waitFor({ state: "attached", timeout: 10000 });
    await fi.setInputFiles([PDF]);
    console.log(`[upload] set 1 file`);

    // Wait for "3 pages" indicator
    let detected = false;
    for (let t = 0; t < 10000; t += 500) {
      await page.waitForTimeout(500);
      const txt = await page.locator("text=/^\\d+ pages?$/").first().textContent().catch(() => null);
      if (txt && /^3 pages?$/.test(txt)) {
        detected = true;
        console.log(`[ui] page count: "${txt}" after ${t + 500}ms`);
        break;
      }
    }
    if (!detected) {
      pass = false;
      failures.push("'3 pages' never appeared");
    }

    // CASE 1: text watermark "CONFIDENTIAL" all pages
    logHeader(`  CASE 1: text='CONFIDENTIAL' scope=all`);
    // The text input has default value="CONFIDENTIAL", no explicit type or id
    const textInput = page.locator('input[value="CONFIDENTIAL"]').first();
    await textInput.fill("CONFIDENTIAL");
    await page.waitForTimeout(200);
    console.log(`[ui] text set`);

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
    if (stat.size < 1000) {
      pass = false;
      failures.push(`case1: output too small (${stat.size}B)`);
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
      .locator("text=/Watermark applied|Working/")
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    console.log(`[ui] case1 toast=${toast}`);

    // CASE 2: scope=odd (pages 1, 3 get watermark, page 2 doesn't)
    logHeader(`  CASE 2: text='DRAFT' scope=odd`);
    await textInput.fill("DRAFT");
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: /odd pages/i }).click();
    await page.waitForTimeout(200);
    console.log(`[ui] scope=odd selected`);

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

    // CASE 3: scope=even
    logHeader(`  CASE 3: scope=even`);
    await page.getByRole("button", { name: /even pages/i }).click();
    await page.waitForTimeout(200);
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
