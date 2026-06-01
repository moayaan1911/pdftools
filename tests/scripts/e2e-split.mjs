import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { PDFDocument } from "pdf-lib";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf"); // 3 pages
const URL = "http://localhost:4173/tool/split";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

const CASES = [
  { mode: "ranges", range: "1-2", expectFiles: ["pages-1-2.pdf"] },
  { mode: "all", range: null, expectFiles: ["page-001.pdf", "page-002.pdf", "page-003.pdf"] },
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
  // Page counts via pdf-lib (reliable, no Spotlight index needed)
  const meta = {};
  for (const f of files) {
    try {
      const bytes = fs.readFileSync(path.join(outDir, f));
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      meta[f] = String(doc.getPageCount());
    } catch (e) {
      meta[f] = "err:" + e.message;
    }
  }
  return { files, meta };
}

async function runCase(page, c, downloadDir) {
  // Click mode tab
  const modeLabel = c.mode === "ranges" ? "By range" : "Every page";
  await page.getByRole("button", { name: new RegExp(`^${modeLabel}$`, "i") }).click();
  console.log(`[ui] mode clicked: ${modeLabel}`);

  // Fill range if ranges mode
  if (c.mode === "ranges") {
    const rangeInput = page.getByPlaceholder("e.g. 1-3, 5, 7-9");
    await rangeInput.fill(c.range);
    console.log(`[ui] range filled: ${c.range}`);
  }

  // Click split button
  const splitBtn = page.getByRole("button", { name: /Split & download ZIP/i });
  const disabled = await splitBtn.isDisabled();
  console.log(`[ui] split btn disabled=${disabled}`);
  if (disabled) throw new Error("split button disabled");

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    splitBtn.click(),
  ]);
  const suggested = download.suggestedFilename();
  if (!suggested.endsWith(".zip")) throw new Error(`expected .zip, got ${suggested}`);

  const zipPath = path.join(downloadDir, suggested);
  await download.saveAs(zipPath);
  const zipSize = fs.statSync(zipPath).size;
  console.log(`[download] file=${suggested} size=${zipSize}B`);

  const { files, meta } = await unzipAndInspect(zipPath);
  console.log(`[zip] contents=${files.join(", ")}`);
  console.log(`[zip] pages=${JSON.stringify(meta)}`);

  // Assertions
  const missing = c.expectFiles.filter((f) => !files.includes(f));
  if (missing.length) throw new Error(`missing files in zip: ${missing.join(", ")}`);

  // Validate page counts
  for (const f of c.expectFiles) {
    const expectName = f;
    if (expectName.startsWith("pages-")) {
      // e.g. pages-1-2.pdf => 2 pages
      const m = expectName.match(/pages-(\d+)-(\d+)/);
      const expected = parseInt(m[2]) - parseInt(m[1]) + 1;
      if (parseInt(meta[expectName]) !== expected) {
        throw new Error(`${expectName}: expected ${expected} pages, got ${meta[expectName]}`);
      }
    } else if (expectName.startsWith("page-")) {
      // page-001.pdf => 1 page
      if (meta[expectName] !== "1") {
        throw new Error(`${expectName}: expected 1 page, got ${meta[expectName]}`);
      }
    }
  }

  // Toast
  const toast = await page
    .locator("text=/Split into \\d+ files/")
    .first()
    .textContent({ timeout: 5000 })
    .catch(() => null);
  console.log(`[ui] toast=${toast}`);
}

async function runForViewport(vp) {
  logHeader(`SPLIT TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
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
  const downloadDir = `/tmp/pdf-split-${vp.name}-${Date.now()}`;
  fs.mkdirSync(downloadDir, { recursive: true });

  try {
    const resp = await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    console.log(`[load] status=${resp.status()}`);
    if (!resp.ok()) {
      pass = false;
      failures.push(`page did not load ok (${resp.status()})`);
    }

    // Upload PDF
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.waitFor({ state: "attached", timeout: 10000 });
    await fileInput.setInputFiles([PDF]);
    console.log(`[upload] set 1 file`);
    await page.waitForTimeout(600);

    // Sanity: 1 chip visible
    const chipCount = await page.locator("text=/tds_zebpay1\\.pdf/").count();
    console.log(`[upload] chips visible=${chipCount}`);

    // Case 1: ranges
    logHeader(`  CASE: by range "1-2"`);
    await runCase(page, CASES[0], downloadDir);

    // Case 2: every page
    logHeader(`  CASE: every page`);
    await runCase(page, CASES[1], downloadDir);

    // Mobile overflow check
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
    } else {
      console.log(`[console] no fatal errors`);
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
