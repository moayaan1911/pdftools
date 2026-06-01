import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/form-sample.pdf");
const URL_PAGE = "http://localhost:4173/tool/forms";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

const FILL = {
  fullName: "MD Ayaan Siddiqui",
  email: "moayaan.eth@gmail.com",
  subscribe: "true",
  country: "UAE",
};

function logHeader(t) {
  console.log("\n" + "=".repeat(60));
  console.log(t);
  console.log("=".repeat(60));
}

async function runForViewport(vp) {
  logHeader(`FORMS TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/forms-${vp.name}-${Date.now()}`;
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

    // Wait for "4 fields detected"
    let detected = false;
    for (let t = 0; t < 10000; t += 500) {
      await page.waitForTimeout(500);
      const txt = await page.locator("text=/\\d+ fields? detected/").first().textContent().catch(() => null);
      if (txt && /4 fields? detected/.test(txt)) {
        detected = true;
        console.log(`[ui] field count: "${txt}" after ${t + 500}ms`);
        break;
      }
    }
    if (!detected) {
      pass = false;
      failures.push("'4 fields detected' never appeared");
    }

    // Fill text fields  -  inputs don't have explicit type="text", use position-based
    const textInputs = page.locator('input:not([type="checkbox"]):not([type="file"]):not([type="button"]):not([type="submit"])');
    const textCount = await textInputs.count();
    console.log(`[ui] text inputs count=${textCount}`);
    if (textCount < 2) {
      pass = false;
      failures.push(`expected 2 text inputs, got ${textCount}`);
    }
    await textInputs.nth(0).fill(FILL.fullName);
    await page.waitForTimeout(200);
    console.log(`[ui] fullName filled`);
    await textInputs.nth(1).fill(FILL.email);
    await page.waitForTimeout(200);
    console.log(`[ui] email filled`);

    // Check subscribe checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();
    await page.waitForTimeout(200);
    console.log(`[ui] subscribe checked`);

    // Select country
    const selects = page.locator("select");
    const selectCount = await selects.count();
    console.log(`[ui] selects count=${selectCount}`);
    if (selectCount >= 1) {
      await selects.first().selectOption(FILL.country);
      console.log(`[ui] country=${FILL.country}`);
    }

    // Click Fill & download
    const fillBtn = page.getByRole("button", { name: /Fill & download/i });
    const disabled = await fillBtn.isDisabled();
    console.log(`[ui] fill btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("fill button disabled");
    }

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      fillBtn.click(),
    ]);
    const suggested = download.suggestedFilename();
    if (!suggested.endsWith(".pdf")) {
      pass = false;
      failures.push(`filename not .pdf: ${suggested}`);
    }
    const outPath = path.join(downloadDir, suggested);
    await download.saveAs(outPath);
    const stat = fs.statSync(outPath);
    console.log(`[download] file=${suggested} size=${stat.size}B`);
    if (stat.size < 1000) {
      pass = false;
      failures.push(`output too small (${stat.size}B)`);
    }

    // Verify fields by re-reading with pdf-lib
    const bytes = fs.readFileSync(outPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = doc.getForm();
    const got = {
      fullName: form.getTextField("fullName").getText(),
      email: form.getTextField("email").getText(),
      subscribe: form.getCheckBox("subscribe").isChecked(),
      country: form.getDropdown("country").getSelected()?.[0],
    };
    console.log(`[verify] filled values:`);
    Object.entries(got).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

    if (got.fullName !== FILL.fullName) {
      pass = false;
      failures.push(`fullName: got "${got.fullName}"`);
    }
    if (got.email !== FILL.email) {
      pass = false;
      failures.push(`email: got "${got.email}"`);
    }
    if (got.subscribe !== true) {
      pass = false;
      failures.push(`subscribe: got ${got.subscribe} (expected true)`);
    }
    if (got.country !== FILL.country) {
      pass = false;
      failures.push(`country: got "${got.country}"`);
    }

    const toast = await page
      .locator("text=/Form filled|Working/")
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
