import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf"); // 3 pages
const URL_PAGE = "http://localhost:4173/tool/extract-text";

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
  logHeader(`EXTRACT-TEXT TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/extract-text-${vp.name}-${Date.now()}`;
  fs.mkdirSync(downloadDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    acceptDownloads: true,
    permissions: ["clipboard-read", "clipboard-write"],
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

    // Wait for page tabs to render (Page 1, Page 2, Page 3)
    let tabsReady = false;
    for (let t = 0; t < 15000; t += 500) {
      await page.waitForTimeout(500);
      const tabCount = await page.locator("button:has-text('Page ')").count();
      if (tabCount >= 3) {
        tabsReady = true;
        console.log(`[ui] page tabs ready after ${t + 500}ms (count=${tabCount})`);
        break;
      }
    }
    if (!tabsReady) {
      pass = false;
      failures.push("page tabs never appeared (text extraction failed?)");
    }

    // Verify text is non-empty in the pre area
    const preText = await page.locator("pre").first().textContent().catch(() => "");
    console.log(`[ui] pre text length=${preText?.length || 0}`);
    if (!preText || preText.length < 5) {
      pass = false;
      failures.push(`pre text too short (${preText?.length} chars)`);
    }

    // Click page 2 tab
    await page.getByRole("button", { name: "Page 2" }).click();
    await page.waitForTimeout(400);
    const preText2 = await page.locator("pre").first().textContent().catch(() => "");
    console.log(`[ui] page 2 pre text length=${preText2?.length || 0}`);
    if (!preText2 || preText2.length < 5) {
      pass = false;
      failures.push(`page 2 pre text too short (${preText2?.length} chars)`);
    }

    // Click page 3 tab
    await page.getByRole("button", { name: "Page 3" }).click();
    await page.waitForTimeout(400);
    const preText3 = await page.locator("pre").first().textContent().catch(() => "");
    console.log(`[ui] page 3 pre text length=${preText3?.length || 0}`);

    // Click Download .txt
    const downloadBtn = page.getByRole("button", { name: /Download \.txt/i });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      downloadBtn.click(),
    ]);
    const suggested = download.suggestedFilename();
    console.log(`[download] file=${suggested}`);
    if (!suggested.endsWith(".txt")) {
      pass = false;
      failures.push(`filename not .txt: ${suggested}`);
    }
    const outPath = path.join(downloadDir, suggested);
    await download.saveAs(outPath);
    const stat = fs.statSync(outPath);
    console.log(`[download] size=${stat.size}B`);

    const content = fs.readFileSync(outPath, "utf-8");
    console.log(`[verify] text length=${content.length} chars`);
    const pageMarkers = (content.match(/--- Page \d+ ---/g) || []).length;
    console.log(`[verify] page markers=${pageMarkers}`);

    if (pageMarkers < 3) {
      pass = false;
      failures.push(`expected 3 page markers, got ${pageMarkers}`);
    }
    if (content.length < 20) {
      pass = false;
      failures.push(`text content too short: ${content.length} chars`);
    }

    // Toast
    const toast = await page
      .locator("text=/Extracted text from \\d+ pages|Copied to clipboard|Working/")
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
