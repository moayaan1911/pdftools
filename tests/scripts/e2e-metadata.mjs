import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf");
const URL_PAGE = "http://localhost:4173/tool/metadata";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

const TEST_META = {
  title: "E2E Test Document",
  author: "Zaki the Agent",
  subject: "Automated metadata validation",
  keywords: "test, e2e, zaki, pdf, metadata",
  creator: "Playwright + Hermes",
};

function logHeader(t) {
  console.log("\n" + "=".repeat(60));
  console.log(t);
  console.log("=".repeat(60));
}

async function runForViewport(vp) {
  logHeader(`METADATA TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
  const downloadDir = `/tmp/metadata-${vp.name}-${Date.now()}`;
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
    await page.waitForTimeout(1500); // allow metadata to be read
    console.log(`[upload] set 1 file`);

    // Fill fields  -  labels are not associated via for=, use position-based selection
    // The form has 5 text inputs in order: title, author, subject, keywords, creator
    const fieldInputs = page.locator('div.grid input[type="text"], div.grid input:not([type])');
    const fieldCount = await fieldInputs.count();
    console.log(`[ui] found ${fieldCount} text inputs in form grid`);
    if (fieldCount < 5) {
      pass = false;
      failures.push(`expected 5 form inputs, got ${fieldCount}`);
    }

    const values = [
      TEST_META.title,
      TEST_META.author,
      TEST_META.subject,
      TEST_META.keywords,
      TEST_META.creator,
    ];
    for (let i = 0; i < values.length; i++) {
      await fieldInputs.nth(i).fill(values[i]);
    }
    await page.waitForTimeout(300);
    console.log(`[ui] all 5 metadata fields filled`);

    // Click Save & download
    const saveBtn = page.getByRole("button", { name: /Save & download/i });
    const disabled = await saveBtn.isDisabled();
    console.log(`[ui] save btn disabled=${disabled}`);
    if (disabled) {
      pass = false;
      failures.push("save button disabled");
    }

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30000 }),
      saveBtn.click(),
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

    // Verify metadata was actually written
    const bytes = fs.readFileSync(outPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const out = {
      title: doc.getTitle() || "",
      author: doc.getAuthor() || "",
      subject: doc.getSubject() || "",
      keywords: (doc.getKeywords() || "").toString(),
      creator: doc.getCreator() || "",
    };
    console.log(`[verify] output metadata:`);
    Object.entries(out).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

    if (out.title !== TEST_META.title) {
      pass = false;
      failures.push(`title mismatch: got "${out.title}", expected "${TEST_META.title}"`);
    }
    if (out.author !== TEST_META.author) {
      pass = false;
      failures.push(`author mismatch: got "${out.author}"`);
    }
    if (out.subject !== TEST_META.subject) {
      pass = false;
      failures.push(`subject mismatch: got "${out.subject}"`);
    }
    if (!out.keywords.includes("test") || !out.keywords.includes("zaki")) {
      pass = false;
      failures.push(`keywords mismatch: got "${out.keywords}"`);
    }
    if (out.creator !== TEST_META.creator) {
      pass = false;
      failures.push(`creator mismatch: got "${out.creator}"`);
    }

    const toast = await page
      .locator("text=/Metadata updated|Working/")
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
