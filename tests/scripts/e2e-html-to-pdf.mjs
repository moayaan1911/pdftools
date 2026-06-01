import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const SAMPLE_HTML = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/sample.html");
const URL_PAGE = "http://localhost:4173/tool/html-to-pdf";

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
  logHeader(`HTML-TO-PDF TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/html2pdf-${vp.name}-${Date.now()}`;
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

    // CASE 1: use default invoice template
    logHeader(`  CASE 1: default invoice template`);
    const convertBtn = page.getByRole("button", { name: /Generate PDF/i });
    const disabled = await convertBtn.isDisabled();
    console.log(`[ui] convert btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("case1: convert button disabled");
    }

    let [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60000 }),
      convertBtn.click(),
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

    // Verify PDF validity + at least 1 page
    let bytes = fs.readFileSync(outPath);
    let doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    let pages = doc.getPages();
    console.log(`[verify] case1 page count=${pages.length}`);
    if (pages.length < 1) {
      pass = false;
      failures.push(`case1: no pages`);
    }

    let toast = await page
      .locator("text=/PDF downloaded|Working/")
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    console.log(`[ui] case1 toast=${toast}`);

    // CASE 2: upload sample.html
    logHeader(`  CASE 2: upload sample.html`);
    const fileInput = page.locator('input[type="file"][accept*="html"]').first();
    await fileInput.waitFor({ state: "attached", timeout: 5000 });
    await fileInput.setInputFiles([SAMPLE_HTML]);
    await page.waitForTimeout(500);

    // Textarea should now contain "sample.html" content
    const textareaVal = await page.locator("textarea").first().inputValue();
    const containsQuarterly = textareaVal.includes("Quarterly Invoice");
    console.log(`[ui] textarea contains 'Quarterly Invoice': ${containsQuarterly}`);
    if (!containsQuarterly) {
      pass = false;
      failures.push("case2: textarea did not load uploaded HTML");
    }

    const previewText = await page.locator("div.prose").first().textContent().catch(() => "");
    const previewHasInvoice = previewText.includes("Quarterly Invoice");
    console.log(`[ui] preview shows 'Quarterly Invoice': ${previewHasInvoice}`);
    if (!previewHasInvoice) {
      pass = false;
      failures.push("case2: preview did not update with uploaded HTML");
    }

    [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60000 }),
      convertBtn.click(),
    ]);
    suggested = download.suggestedFilename();
    outPath = path.join(downloadDir, `case2-${suggested}`);
    await download.saveAs(outPath);
    stat = fs.statSync(outPath);
    console.log(`[download] case2 file=${suggested} size=${stat.size}B`);
    if (stat.size < 1000) {
      pass = false;
      failures.push(`case2: output too small (${stat.size}B)`);
    }

    bytes = fs.readFileSync(outPath);
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    pages = doc.getPages();
    console.log(`[verify] case2 page count=${pages.length}`);
    if (pages.length < 1) {
      pass = false;
      failures.push(`case2: no pages`);
    }

    toast = await page
      .locator("text=/PDF downloaded|Working/")
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
