import { chromium } from "playwright";
const URL_PAGE = "http://localhost:4173/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(URL_PAGE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Find the element containing "All", "Organize", etc.
  const allPill = page.locator("button:has-text('All')").first();
  const parent = allPill.locator("..");
  const tag = await parent.evaluate((el) => el.tagName + "." + el.className);
  console.log("parent of 'All' button:", tag);
  const styles = await parent.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      paddingBottom: cs.paddingBottom,
      scrollbarWidth: cs.scrollbarWidth,
      overflowX: cs.overflowX,
      clientHeight: el.clientHeight,
      offsetHeight: el.offsetHeight,
    };
  });
  console.log("styles:", styles);

  // Check all elements with overflow-x-auto
  const all = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter(el => {
      const cs = getComputedStyle(el);
      return cs.overflowX === 'auto' || cs.overflowX === 'scroll';
    });
    return els.map(el => ({
      tag: el.tagName,
      cls: el.className.toString().slice(0, 100),
      offsetH: el.offsetHeight,
      clientH: el.clientHeight,
      paddingB: getComputedStyle(el).paddingBottom,
    }));
  });
  console.log("elements with overflow-x:");
  all.forEach(e => console.log("  ", e));

  await browser.close();
})();
