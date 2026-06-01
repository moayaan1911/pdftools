import { chromium } from "playwright";
import path from "node:path";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf");
const URL_PAGE = "http://localhost:4173/tool/ocr";

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
  logHeader(`OCR TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
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
    await page.waitForTimeout(500);

    // Click Recognize text
    const ocrBtn = page.getByRole("button", { name: /Recognize text/i });
    const disabled = await ocrBtn.isDisabled();
    console.log(`[ui] ocr btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("ocr button disabled");
    }

    await ocrBtn.click();
    console.log(`[ui] OCR started, waiting up to 90s for completion...`);

    // Wait for "X lines recognized" text to appear (means OCR done)
    let ocrDone = false;
    for (let t = 0; t < 90; t += 2) {
      await page.waitForTimeout(2000);
      const linesTxt = await page.locator("text=/\\d+ lines recognized/").first().textContent().catch(() => null);
      if (linesTxt) {
        ocrDone = true;
        console.log(`[ui] OCR done after ${t + 2}s: "${linesTxt}"`);
        break;
      }
      // Also check for error toast
      const errTxt = await page.locator("text=/OCR failed/").first().textContent().catch(() => null);
      if (errTxt) {
        pass = false;
        failures.push(`OCR error toast: ${errTxt}`);
        break;
      }
      if (t % 10 === 0) {
        console.log(`[ui] still waiting... ${t}s`);
      }
    }

    if (!ocrDone && !failures.some((f) => f.startsWith("OCR error"))) {
      pass = false;
      failures.push("OCR did not complete in 90s");
    }

    // Verify the <pre> with OCR text has content
    const preText = await page.locator("pre").first().textContent().catch(() => "");
    console.log(`[verify] pre text length=${preText?.length || 0}`);
    if (!ocrDone || !preText || preText.length < 10) {
      pass = false;
      failures.push(`OCR text empty or too short (${preText?.length} chars)`);
    }

    // Check page markers
    const pageMarkers = (preText.match(/--- Page \d+ ---/g) || []).length;
    console.log(`[verify] page markers=${pageMarkers}`);
    if (ocrDone && pageMarkers < 3) {
      pass = false;
      failures.push(`expected 3 page markers, got ${pageMarkers}`);
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
