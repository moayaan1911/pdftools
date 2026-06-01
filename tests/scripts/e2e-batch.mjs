import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { PDFDocument } from "pdf-lib";

const PDF1 = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf");
const PDF2 = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay2.pdf");
const URL_PAGE = "http://localhost:4173/tool/batch";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

function logHeader(t) {
  console.log("\n" + "=".repeat(60));
  console.log(t);
  console.log("=".repeat(60));
}

async function unzipAndInspect(zipPath) {
  const outDir = path.dirname(zipPath) + "-unzipped";
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  execSync(`unzip -q -o "${zipPath}" -d "${outDir}"`);
  const files = fs.readdirSync(outDir).sort();
  return files;
}

async function runForViewport(vp) {
  logHeader(`BATCH TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/batch-${vp.name}-${Date.now()}`;
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

    // Upload 2 PDFs
    const fi = page.locator('input[type="file"]').first();
    await fi.waitFor({ state: "attached", timeout: 10000 });
    await fi.setInputFiles([PDF1, PDF2]);
    await page.waitForTimeout(800);

    // Verify 2 chips visible
    const chipCount = await page.locator("text=/tds_zebpay\\d\\.pdf/").count();
    console.log(`[ui] chips visible=${chipCount}`);
    if (chipCount < 2) {
      pass = false;
      failures.push(`expected 2 chips, got ${chipCount}`);
    }

    // Default op is "rotate"; click Process
    const processBtn = page.getByRole("button", { name: /Process \d+ file/i });
    const disabled = await processBtn.isDisabled();
    console.log(`[ui] process btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("process button disabled");
    }

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      processBtn.click(),
    ]);
    const suggested = download.suggestedFilename();
    if (!suggested.endsWith(".zip")) {
      pass = false;
      failures.push(`filename not .zip: ${suggested}`);
    }
    const zipPath = path.join(downloadDir, suggested);
    await download.saveAs(zipPath);
    const stat = fs.statSync(zipPath);
    console.log(`[download] file=${suggested} size=${stat.size}B`);

    if (stat.size < 1000) {
      pass = false;
      failures.push(`output too small (${stat.size}B)`);
    }

    // Unzip and check files
    const files = await unzipAndInspect(zipPath);
    console.log(`[zip] contents=${files.join(", ")}`);
    if (files.length !== 2) {
      pass = false;
      failures.push(`expected 2 files in zip, got ${files.length}`);
    }

    // Verify each rotated PDF has +90° rotation
    const outDir = path.dirname(zipPath) + "-unzipped";
    for (const f of files) {
      const bytes = fs.readFileSync(path.join(outDir, f));
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = doc.getPages();
      const rotations = pages.map((p) => p.getRotation().angle);
      console.log(`[verify] ${f}: pages=${pages.length} rotations=${JSON.stringify(rotations)}`);
      // Original PDFs have 0 rotation; after +90° they should be 90
      for (let i = 0; i < rotations.length; i++) {
        if (rotations[i] !== 90) {
          pass = false;
          failures.push(`${f} page ${i + 1} rotation ${rotations[i]} (expected 90)`);
        }
      }
    }

    const toast = await page
      .locator("text=/Processed \\d+ files|Working/")
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
