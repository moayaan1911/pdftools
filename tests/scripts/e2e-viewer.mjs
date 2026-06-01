import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PDF = path.resolve("/Users/moayaan.eth/pdf-toolkit/public/tds_zebpay1.pdf"); // 3 pages
const URL_PAGE = "http://localhost:4173/tool/viewer";

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
  logHeader(`VIEWER TOOL  -  ${vp.name} (${vp.width}x${vp.height})`);
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

    // Wait for canvas to render
    let canvasReady = false;
    for (let t = 0; t < 20000; t += 500) {
      await page.waitForTimeout(500);
      const canvasSize = await page.locator("canvas").first().evaluate((c) => ({
        w: c.width,
        h: c.height,
        hasContent: c.width > 100 && c.height > 100,
      })).catch(() => null);
      if (canvasSize?.hasContent) {
        canvasReady = true;
        console.log(`[ui] canvas ready after ${t + 500}ms: ${canvasSize.w}x${canvasSize.h}`);
        break;
      }
    }
    if (!canvasReady) {
      pass = false;
      failures.push("canvas never rendered with content");
    }

    // Check page counter  -  input value isn't in innerText, so read it directly
    const getPageNum = async () => {
      return await page.locator('input[type="number"]').first().inputValue().catch(() => "");
    };
    const getTotalPages = async () => {
      // Total is in a span: " / N"
      return await page.locator("text=/\\/\\s*\\d+/").first().textContent().catch(() => "");
    };
    const initialPage = await getPageNum();
    const initialTotal = await getTotalPages();
    console.log(`[ui] page counter: input="${initialPage}" total="${initialTotal}"`);
    if (initialPage !== "1") {
      pass = false;
      failures.push(`page input not 1: "${initialPage}"`);
    }
    if (!/\/\s*3/.test(initialTotal)) {
      pass = false;
      failures.push(`total pages wrong: "${initialTotal}"`);
    }

    // Click next page (ChevronRight button)
    const nextBtn = page.getByRole("button").filter({ has: page.locator("svg.lucide-chevron-right") });
    await nextBtn.click();
    await page.waitForTimeout(500);
    const page2 = await getPageNum();
    console.log(`[ui] after next: page="${page2}"`);
    if (page2 !== "2") {
      pass = false;
      failures.push(`page input after next wrong: "${page2}" (expected 2)`);
    }

    // Click next again
    await nextBtn.click();
    await page.waitForTimeout(500);
    const page3 = await getPageNum();
    console.log(`[ui] after next x2: page="${page3}"`);
    if (page3 !== "3") {
      pass = false;
      failures.push(`page input after 2 nexts wrong: "${page3}" (expected 3)`);
    }

    // Next button should be disabled at last page
    const nextDisabled = await nextBtn.isDisabled();
    console.log(`[ui] next btn disabled at last page: ${nextDisabled}`);
    if (!nextDisabled) {
      pass = false;
      failures.push("next button should be disabled at last page");
    }

    // Click prev twice
    const prevBtn = page.getByRole("button").filter({ has: page.locator("svg.lucide-chevron-left") });
    await prevBtn.click();
    await prevBtn.click();
    await page.waitForTimeout(500);
    const page1 = await getPageNum();
    console.log(`[ui] after prev x2: page="${page1}"`);
    if (page1 !== "1") {
      pass = false;
      failures.push(`page input after prevs wrong: "${page1}" (expected 1)`);
    }

    // Test zoom
    const zoomIn = page.getByRole("button").filter({ has: page.locator("svg.lucide-zoom-in") });
    const initialScaleTxt = await page.locator("text=/%$/").first().textContent().catch(() => null);
    console.log(`[ui] initial scale: ${initialScaleTxt}`);
    await zoomIn.click();
    await page.waitForTimeout(400);
    const newScaleTxt = await page.locator("text=/%$/").first().textContent().catch(() => null);
    console.log(`[ui] after zoom in: ${newScaleTxt}`);
    if (initialScaleTxt === newScaleTxt) {
      pass = false;
      failures.push(`zoom didn't change scale (still ${newScaleTxt})`);
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
