import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf");
const URL_PAGE = "http://localhost:4173/tool/crop";

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
  logHeader(`CROP TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/crop-${vp.name}-${Date.now()}`;
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

    // Wait for "3 pages"
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

    // Read original media box for comparison
    const origBytes = fs.readFileSync(PDF);
    const origDoc = await PDFDocument.load(origBytes, { ignoreEncryption: true });
    const origMedia = origDoc.getPages()[0].getMediaBox();
    const origW = origMedia.width, origH = origMedia.height;
    console.log(`[verify] original mediaBox: ${origW.toFixed(2)}x${origH.toFixed(2)}`);

    // CASE 1: custom crop top=20 right=20 bottom=20 left=20
    logHeader(`  CASE 1: custom crop 20pt all sides`);
    // Custom is default; 4 number inputs visible
    const numInputs = page.locator('input[type="number"]');
    const numCount = await numInputs.count();
    console.log(`[ui] number inputs=${numCount}`);
    if (numCount < 4) {
      pass = false;
      failures.push(`expected 4 number inputs, got ${numCount}`);
    }
    // Set each to 20 (top, right, bottom, left)
    for (let i = 0; i < 4; i++) {
      await numInputs.nth(i).fill("20");
    }
    await page.waitForTimeout(200);
    console.log(`[ui] all 4 sides set to 20`);

    const cropBtn = page.getByRole("button", { name: /Crop & download/i });
    const disabled = await cropBtn.isDisabled();
    console.log(`[ui] crop btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("case1: crop button disabled");
    }

    let [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      cropBtn.click(),
    ]);
    let suggested = download.suggestedFilename();
    let outPath = path.join(downloadDir, `case1-${suggested}`);
    await download.saveAs(outPath);
    let stat = fs.statSync(outPath);
    console.log(`[download] case1 file=${suggested} size=${stat.size}B`);

    let bytes = fs.readFileSync(outPath);
    let doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    let p = doc.getPages()[0];
    let mb = p.getMediaBox();
    console.log(`[verify] case1 mediaBox: ${mb.width.toFixed(2)}x${mb.height.toFixed(2)} (orig ${origW.toFixed(2)}x${origH.toFixed(2)})`);
    // Should be 40 smaller on each axis
    if (Math.abs(mb.width - (origW - 40)) > 1) {
      pass = false;
      failures.push(`case1: width ${mb.width.toFixed(2)} (expected ${(origW - 40).toFixed(2)})`);
    }
    if (Math.abs(mb.height - (origH - 40)) > 1) {
      pass = false;
      failures.push(`case1: height ${mb.height.toFixed(2)} (expected ${(origH - 40).toFixed(2)})`);
    }

    let toast = await page
      .locator("text=/Cropped|Working/")
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    console.log(`[ui] case1 toast=${toast}`);

    // CASE 2: 16:9 preset
    logHeader(`  CASE 2: 16:9 preset`);
    await page.getByRole("button", { name: /^16:9$/ }).click();
    await page.waitForTimeout(200);
    console.log(`[ui] 16:9 selected`);

    [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      cropBtn.click(),
    ]);
    suggested = download.suggestedFilename();
    outPath = path.join(downloadDir, `case2-${suggested}`);
    await download.saveAs(outPath);
    stat = fs.statSync(outPath);
    console.log(`[download] case2 file=${suggested} size=${stat.size}B`);

    bytes = fs.readFileSync(outPath);
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    p = doc.getPages()[0];
    mb = p.getMediaBox();
    const ratio = mb.width / mb.height;
    console.log(`[verify] case2 mediaBox: ${mb.width.toFixed(2)}x${mb.height.toFixed(2)} ratio=${ratio.toFixed(3)}`);
    if (Math.abs(ratio - 16 / 9) > 0.01) {
      pass = false;
      failures.push(`case2: ratio ${ratio.toFixed(3)} (expected ${(16/9).toFixed(3)})`);
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
