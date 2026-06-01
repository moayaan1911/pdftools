import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf"); // 3 pages
const URL = "http://localhost:4173/tool/pdf-to-images";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

const CASES = [
  { format: "PNG", ext: "png", expectFiles: ["page-001.png", "page-002.png", "page-003.png"] },
  { format: "JPEG", ext: "jpeg", expectFiles: ["page-001.jpeg", "page-002.jpeg", "page-003.jpeg"] },
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
  const meta = {};
  for (const f of files) {
    const stat = fs.statSync(path.join(outDir, f));
    // Read first few bytes for PNG/JPEG magic number
    const fd = fs.openSync(path.join(outDir, f), "r");
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);
    let magic = "unknown";
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) magic = "png";
    else if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) magic = "jpeg";
    meta[f] = { size: stat.size, magic };
  }
  return { files, meta };
}

async function runCase(page, c, downloadDir) {
  // Click format tab
  await page.getByRole("button", { name: new RegExp(`^${c.format}$`, "i") }).click();
  console.log(`[ui] format=${c.format}`);
  await page.waitForTimeout(1500); // let previews re-render

  const convertBtn = page.getByRole("button", { name: /Convert & download ZIP/i });
  const disabled = await convertBtn.isDisabled();
  console.log(`[ui] convert btn disabled=${disabled}`);
  if (disabled) throw new Error("convert button disabled");

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 60000 }),
    convertBtn.click(),
  ]);
  const suggested = download.suggestedFilename();
  if (!suggested.endsWith(".zip")) throw new Error(`expected .zip, got ${suggested}`);

  const zipPath = path.join(downloadDir, suggested);
  await download.saveAs(zipPath);
  const zipSize = fs.statSync(zipPath).size;
  console.log(`[download] file=${suggested} size=${zipSize}B`);

  const { files, meta } = await unzipAndInspect(zipPath);
  console.log(`[zip] contents=${files.join(", ")}`);
  console.log(`[zip] meta=${JSON.stringify(meta)}`);

  const missing = c.expectFiles.filter((f) => !files.includes(f));
  if (missing.length) throw new Error(`missing files: ${missing.join(", ")}`);

  for (const f of c.expectFiles) {
    if (meta[f].magic !== c.ext) {
      throw new Error(`${f}: magic=${meta[f].magic} (expected ${c.ext})`);
    }
    if (meta[f].size < 200) {
      throw new Error(`${f}: too small (${meta[f].size}B)`);
    }
  }

  const toast = await page
    .locator("text=/Converted \\d+ pages|Working/")
    .first()
    .textContent({ timeout: 5000 })
    .catch(() => null);
  console.log(`[ui] toast=${toast}`);
}

async function runForViewport(vp) {
  logHeader(`PDF-TO-IMAGES TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/pdf-to-img-${vp.name}-${Date.now()}`;
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
    console.log(`[upload] set 1 file`);

    // Wait for preview thumbnails to render
    let previewsRendered = false;
    for (let t = 0; t < 20000; t += 1000) {
      await page.waitForTimeout(1000);
      const imgCount = await page.locator('img[alt=""]').count();
      if (imgCount >= 3) {
        previewsRendered = true;
        console.log(`[ui] previews rendered after ${t + 1000}ms (count=${imgCount})`);
        break;
      }
    }
    if (!previewsRendered) {
      pass = false;
      failures.push("preview thumbnails never rendered");
    }

    // Case 1: PNG
    logHeader(`  CASE 1: PNG`);
    await runCase(page, CASES[0], downloadDir);

    // Case 2: JPEG
    logHeader(`  CASE 2: JPEG`);
    await runCase(page, CASES[1], downloadDir);

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
