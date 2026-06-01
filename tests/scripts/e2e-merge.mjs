import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PDF_A = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf");
const PDF_B = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay2.pdf");
const URL = "http://localhost:4173/tool/merge";

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
  logHeader(`MERGE TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/pdf-merge-${vp.name}-${Date.now()}`;
  fs.mkdirSync(downloadDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    acceptDownloads: true,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

  let pass = true;
  const failures = [];

  try {
    // 1) Navigate
    const resp = await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    console.log(`[load] status=${resp.status()}`);
    if (!resp.ok()) {
      pass = false;
      failures.push(`page did not load ok (${resp.status()})`);
    }

    // 2) Page heading/sanity
    await page.waitForLoadState("domcontentloaded");
    const title = await page.title();
    console.log(`[load] title=${title}`);
    const h1Text = await page.locator("h1, h2").first().textContent().catch(() => null);
    console.log(`[load] heading=${h1Text}`);

    // 3) File input present? (input is hidden by design  -  DropZone wraps it)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.waitFor({ state: "attached", timeout: 10000 });
    console.log(`[ui] file input attached`);

    // 4) Upload both PDFs
    await fileInput.setInputFiles([PDF_A, PDF_B]);
    console.log(`[upload] set 2 files`);

    // 5) Wait for file chips/rows to appear (DropZone renders them)
    await page.waitForTimeout(800);
    const chipCount = await page.locator("text=/tds_zebpay\\d\\.pdf/").count();
    console.log(`[upload] chips visible=${chipCount}`);
    if (chipCount < 2) {
      pass = false;
      failures.push(`only ${chipCount} file chip(s) visible (expected 2)`);
    }

    // 6) Merge button visible + enabled
    const mergeBtn = page.getByRole("button", { name: /Merge 2 files/i });
    await mergeBtn.waitFor({ timeout: 10000 });
    const disabled = await mergeBtn.isDisabled();
    console.log(`[ui] merge btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("merge button still disabled after upload");
    }

    // 7) Click + capture download
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      mergeBtn.click(),
    ]);
    const suggested = download.suggestedFilename();
    const outPath = path.join(downloadDir, suggested);
    await download.saveAs(outPath);
    const stat = fs.statSync(outPath);
    console.log(`[download] file=${suggested} size=${stat.size}B`);

    if (stat.size < 1000) {
      pass = false;
      failures.push(`downloaded file too small (${stat.size}B)  -  likely empty/error`);
    }
    if (!suggested.endsWith(".pdf")) {
      pass = false;
      failures.push(`filename is not .pdf (${suggested})`);
    }

    // 8) Toast/result indicator
    const toastTxt = await page
      .locator("text=/Merged 2 PDFs|Working/")
      .first()
      .textContent({ timeout: 5000 })
      .catch(() => null);
    console.log(`[ui] toast/result=${toastTxt}`);

    // 9) Console errors check
    const fatal = consoleErrors.filter(
      (e) => !/favicon|404|hydration|downloadable font|Failed to load resource/i.test(e)
    );
    if (fatal.length) {
      console.log(`[console] errors:`);
      fatal.forEach((e) => console.log("  - " + e));
    } else {
      console.log(`[console] no fatal errors`);
    }

    // 10) Mobile-only quick check: viewport not overflowing
    if (vp.name === "mobile") {
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      console.log(`[mobile] horizontal overflow=${overflow}`);
      if (overflow) failures.push("horizontal overflow on mobile");
    }
  } catch (e) {
    pass = false;
    failures.push(`exception: ${e.message}`);
    console.log(`[ERROR] ${e.stack || e.message}`);
  } finally {
    if (consoleErrors.length) {
      console.log(`[console] total=${consoleErrors.length}`);
    }
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

const allPass = results.every((r) => r.pass);
process.exit(allPass ? 0 : 1);
