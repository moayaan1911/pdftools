import { chromium } from "playwright";
import path from "node:path";

const PDF1 = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf");
const PDF2 = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay2.pdf");
const URL_PAGE = "http://localhost:4173/tool/compare";

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
  logHeader(`COMPARE TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
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

    // Upload 2 PDFs
    const fi = page.locator('input[type="file"]').first();
    await fi.waitFor({ state: "attached", timeout: 10000 });
    await fi.setInputFiles([PDF1, PDF2]);

    // Wait for both canvases to render with content
    let canvasesReady = false;
    for (let t = 0; t < 20000; t += 500) {
      await page.waitForTimeout(500);
      const sizes = await page.locator("canvas").evaluateAll((els) =>
        els.map((c) => ({ w: c.width, h: c.height }))
      );
      if (sizes.length >= 2 && sizes[0].w > 50 && sizes[1].w > 50) {
        canvasesReady = true;
        console.log(`[ui] canvases ready after ${t + 500}ms: A=${sizes[0].w}x${sizes[0].h} B=${sizes[1].w}x${sizes[1].h}`);
        break;
      }
    }
    if (!canvasesReady) {
      pass = false;
      failures.push("canvases never rendered with content");
    }

    // Check "Page 1 of 3" text
    const pageTxt = await page.locator("text=/Page \\d+ of \\d+/").first().textContent().catch(() => null);
    console.log(`[ui] page indicator: "${pageTxt}"`);
    if (!pageTxt || !/Page\s+1\s+of\s+3/.test(pageTxt)) {
      pass = false;
      failures.push(`page indicator wrong: "${pageTxt}"`);
    }

    // Check A and B labels with filenames
    const aLabel = await page.locator("text=/^A: tds_zebpay1\\.pdf$/").count();
    const bLabel = await page.locator("text=/^B: tds_zebpay2\\.pdf$/").count();
    console.log(`[ui] A label count=${aLabel}, B label count=${bLabel}`);
    if (aLabel < 1 || bLabel < 1) {
      pass = false;
      failures.push(`labels missing: A=${aLabel} B=${bLabel}`);
    }

    // Click next
    const nextBtn = page.getByRole("button").filter({ has: page.locator("svg.lucide-chevron-right") });
    await nextBtn.click();
    await page.waitForTimeout(600);
    const pageTxt2 = await page.locator("text=/Page \\d+ of \\d+/").first().textContent().catch(() => null);
    console.log(`[ui] after next: "${pageTxt2}"`);
    if (!pageTxt2 || !/Page\s+2\s+of\s+3/.test(pageTxt2)) {
      pass = false;
      failures.push(`page after next wrong: "${pageTxt2}"`);
    }

    // Both canvases should still have content
    const sizes2 = await page.locator("canvas").evaluateAll((els) =>
      els.map((c) => ({ w: c.width, h: c.height }))
    );
    console.log(`[ui] canvases after next: A=${sizes2[0]?.w}x${sizes2[0]?.h} B=${sizes2[1]?.w}x${sizes2[1]?.h}`);
    if (sizes2[0]?.w < 50 || sizes2[1]?.w < 50) {
      pass = false;
      failures.push("canvases lost content after navigation");
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
