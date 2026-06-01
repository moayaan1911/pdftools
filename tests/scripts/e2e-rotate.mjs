import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf");
const URL = "http://localhost:4173/tool/rotate";

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
  logHeader(`ROTATE TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/pdf-rotate-${vp.name}-${Date.now()}`;
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
  let thumbRenderOk = false;

  try {
    const resp = await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    if (!resp.ok()) {
      pass = false;
      failures.push(`page did not load ok (${resp.status()})`);
    }

    const fi = page.locator('input[type="file"]').first();
    await fi.waitFor({ state: "attached", timeout: 10000 });
    await fi.setInputFiles([PDF]);

    // Wait for thumbnails (poll up to 20s)
    let elapsed = 0;
    while (elapsed < 20000) {
      await page.waitForTimeout(1000);
      elapsed += 1000;
      const aspect = await page.locator('div[class*="aspect-"]').count();
      if (aspect > 0) {
        thumbRenderOk = true;
        console.log(`[ui] thumbnails rendered after ${elapsed}ms (count=${aspect})`);
        break;
      }
    }
    if (!thumbRenderOk) {
      pass = false;
      failures.push("thumbnails never rendered (pdfjs renderPdfThumbnails failed silently)");
    }

    // Try rotate-right on page 1 (if thumbnails exist)
    if (thumbRenderOk) {
      const rBtns = page.getByRole("button", { name: "Rotate right" });
      const rCount = await rBtns.count();
      console.log(`[ui] rotate-right buttons=${rCount}`);
      if (rCount >= 1) {
        await rBtns.nth(0).click();
        await page.waitForTimeout(500);
        console.log(`[ui] clicked rotate-right on page 1`);
      }
    }

    // Apply & download (works even without rotation)
    const applyBtn = page.getByRole("button", { name: /Apply & download/i });
    const disabled = await applyBtn.isDisabled();
    console.log(`[ui] apply btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("apply button disabled");
    }

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      applyBtn.click(),
    ]);
    const suggested = download.suggestedFilename();
    const outPath = path.join(downloadDir, suggested);
    await download.saveAs(outPath);
    const stat = fs.statSync(outPath);
    console.log(`[download] file=${suggested} size=${stat.size}B`);

    if (!suggested.endsWith(".pdf")) {
      pass = false;
      failures.push(`filename not .pdf`);
    }
    if (stat.size < 1000) {
      pass = false;
      failures.push(`downloaded file too small (${stat.size}B)`);
    }

    // Verify: page count + rotation
    const bytes = fs.readFileSync(outPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = doc.getPages();
    const rotations = pages.map((p) => p.getRotation().angle);
    console.log(`[verify] pages=${pages.length} rotations=${JSON.stringify(rotations)}`);

    if (pages.length !== 3) {
      pass = false;
      failures.push(`page count ${pages.length} (expected 3)`);
    }
    if (thumbRenderOk && rotations[0] !== 90) {
      pass = false;
      failures.push(`page 1 rotation ${rotations[0]} (expected 90 after rotate-right)`);
    }

    const toast = await page
      .locator("text=/Rotation applied|Working/")
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
