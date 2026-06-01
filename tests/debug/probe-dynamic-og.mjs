import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Watch console + network
  page.on("console", (m) => console.log(`[browser ${m.type()}]`, m.text()));
  page.on("pageerror", (e) => console.log(`[browser error]`, e.message));
  page.on("requestfailed", (r) => console.log(`[request failed]`, r.url(), r.failure()?.errorText));

  try {
    const resp = await page.goto("http://localhost:4173/tool/merge/opengraph-image", { timeout: 30000, waitUntil: "domcontentloaded" });
    console.log("status:", resp?.status());
    console.log("content-type:", resp?.headers()["content-type"]);
    if (resp) {
      const buf = await resp.body();
      console.log("body bytes:", buf.length);
    }
  } catch (e) {
    console.log("NAV ERROR:", e.message);
  }
  await browser.close();
})();
