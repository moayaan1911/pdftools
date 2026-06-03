// E2E test: HTML to PDF tool must fire the success download modal
import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });

console.log("→ /tool/html-to-pdf");
await page.goto("http://localhost:3000/tool/html-to-pdf", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1500);

console.log("→ Click the action button (Convert/Generate)");
// Try to find the action button by looking for the GeneratePDF button or a primary action
const actionBtn = page.locator("button.px-5.py-2\\.5").first();
await actionBtn.waitFor({ state: "visible", timeout: 10000 });
console.log(`  action button text: "${await actionBtn.textContent()}"`);

// Listen for download + modal
const downloadPromise = page.waitForEvent("download", { timeout: 30000 }).catch(() => null);
await actionBtn.click();
console.log("  clicked convert");

const download = await downloadPromise;
if (!download) {
  console.log("  ✗ NO DOWNLOAD FIRED");
  process.exit(1);
}
console.log(`  ✓ download fired: ${download.suggestedFilename()}`);

// Wait for modal to appear — wait for the explicit "Download ready" text
try {
  await page.waitForSelector("text=Download ready", { timeout: 10000 });
  console.log("  modal appeared");
} catch {
  console.log("  ✗ MODAL NEVER APPEARED");
}
await page.waitForTimeout(500); // let animations settle
await page.screenshot({ path: "/tmp/html-to-pdf-modal.png", fullPage: false });
// Take second screenshot of the entire modal container
try {
  const modalContainer = page.locator("text=Download ready").first().locator("xpath=ancestor::div[contains(@class,'fixed')][1]");
  await modalContainer.screenshot({ path: "/tmp/modal-only.png" });
  console.log("  saved /tmp/modal-only.png");
} catch (e) { console.log("  modal element screenshot failed:", e.message.slice(0, 80)); }

const modalVisible = await page.locator("text=Download ready").isVisible().catch(() => false);
const tipVisible = await page.locator("text=Support 18PDF").isVisible().catch(() => false);
const loomlessVisible = await page.locator("a:has-text('LoomLess')").first().isVisible().catch(() => false);
const imanvibesVisible = await page.locator("a:has-text('ImanVibes')").first().isVisible().catch(() => false);

console.log(`  modal "Download ready" visible: ${modalVisible}`);
console.log(`  modal "Support 18PDF" visible: ${tipVisible}`);
console.log(`  modal "LoomLess" visible: ${loomlessVisible}`);
console.log(`  modal "ImanVibes" visible: ${imanvibesVisible}`);

// Test: clicking anywhere on the support row should open the support link
const supportRow = page.locator("text=Support 18PDF").first();
if (await supportRow.isVisible()) {
  const popupPromise = page.context().waitForEvent("page", { timeout: 5000 }).catch(() => null);
  await supportRow.click();
  const popup = await popupPromise;
  console.log(`  support row click → new tab opened: ${popup ? popup.url() : "NO (click was captured by child element)"}`);
}

await page.screenshot({ path: "/tmp/html-to-pdf-modal.png", fullPage: false });
console.log("\n========================================");
const pass = modalVisible && loomlessVisible && imanvibesVisible;
console.log(pass ? "✅ HTML to PDF: MODAL WORKS" : "✗ HTML to PDF: MODAL BROKEN");
if (errors.length) console.log("JS errors:", errors.slice(0, 3));
console.log("========================================");

await browser.close();
process.exit(pass ? 0 : 1);
