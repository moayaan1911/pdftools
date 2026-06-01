import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Test modal
  await page.goto("http://localhost:4173/tool/merge", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("pdf-toolkit:download", { detail: { filename: "merged.pdf" } }));
  });
  await page.waitForTimeout(500);
  const modalVisible = await page.locator('text=Your file is ready').isVisible().catch(() => false);
  const loomless = await page.locator('text=LoomLess').isVisible().catch(() => false);
  const iman = await page.locator('text=ImanVibes').isVisible().catch(() => false);
  const support = await page.locator('text=Support PDF Toolkit').isVisible().catch(() => false);
  console.log("modal visible:", modalVisible);
  console.log("LoomLess:", loomless, "ImanVibes:", iman, "Support line:", support);
  await page.screenshot({ path: "/tmp/modal-desktop.png" });

  // Test FAQ page
  await page.goto("http://localhost:4173/faq", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const faqH1 = await page.locator('h1').first().textContent();
  console.log("faq h1:", faqH1);
  const faqCount = await page.locator('details').count();
  console.log("faq details count:", faqCount);
  await page.screenshot({ path: "/tmp/faq-desktop.png", fullPage: false });

  // Test privacy page
  await page.goto("http://localhost:4173/privacy-policy", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const ppH1 = await page.locator('h1').first().textContent();
  console.log("privacy h1:", ppH1);
  await page.screenshot({ path: "/tmp/privacy-desktop.png", fullPage: false });

  // Verify icons in header
  await page.goto("http://localhost:4173/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const hasCoffee = await page.locator('[aria-label="Buy me a coffee"]').count();
  const hasGitHub = await page.locator('[aria-label="GitHub repository"]').count();
  const hasFaqLink = await page.locator('a[href="/faq"]').count();
  const hasPrivacyLink = await page.locator('a[href="/privacy-policy"]').count();
  const footerBuilt = await page.locator('text=Built by moayaan.eth').count();
  console.log("Coffee icon:", hasCoffee, "GitHub icon:", hasGitHub);
  console.log("FAQ link:", hasFaqLink, "Privacy link:", hasPrivacyLink);
  console.log("Footer 'Built by':", footerBuilt);

  // Mobile modal
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mctx.newPage();
  await mpage.goto("http://localhost:4173/tool/merge", { waitUntil: "domcontentloaded" });
  await mpage.waitForTimeout(500);
  await mpage.evaluate(() => {
    window.dispatchEvent(new CustomEvent("pdf-toolkit:download", { detail: { filename: "merged.pdf" } }));
  });
  await mpage.waitForTimeout(500);
  await mpage.screenshot({ path: "/tmp/modal-mobile.png" });

  await browser.close();
  console.log("\nDone");
})();
