// Regenerates docs/screens/*.png from the running dev server using the
// system Chrome (Playwright channel:"chrome"). Run the dev server first,
// then: node scripts/capture-screens.mjs
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:5184";
const OUT = "docs/screens";

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// Start clean so the deck shows the default (broadly-positive) dataset.
await page.goto(`${BASE}/overview`, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

async function shot(path, file, { wait = 900, before } = {}) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(wait);
  if (before) await before();
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log("captured", file);
}

// Splash — wait past the 2.6s logo hold for the platform chooser.
await shot("/", "00-splash.png", { wait: 3200 });
await shot("/overview", "01-group-overview.png");
await shot("/centres/riverside", "02-centre-operations.png");
await shot("/findings", "03-findings-tracker.png");
// HIQA now opens on the all-centres group position (Peppard vs sector).
await shot("/standards", "04-standards-register.png");
await shot("/kpis", "05-kpi-framework.png");
await shot("/centres/riverside/readiness", "06-readiness-pack.png", { wait: 1200 });
await shot("/board-pack", "07-board-pack.png", { wait: 1200 });
await shot("/centres/riverside/return", "08-dept-return.png", { wait: 1200 });

// Room-entry dialog — the operator write-through story.
await shot("/centres/riverside", "09-room-entry.png", {
  before: async () => {
    await page.locator('table[aria-label="Room register"] tbody tr').first().click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(400);
  },
});

// Fire registers + mandatory notices panel (right column).
await shot("/centres/riverside", "10-fire-notices.png", {
  before: async () => {
    await page.getByText("Fire safety registers").scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 620));
    await page.waitForTimeout(300);
  },
});

// NEW: HIQA group drill-down with the per-facility filter.
await shot("/standards", "11-standards-group-filter.png", {
  before: async () => {
    await page.getByLabel("Substantially compliant — show details").click();
    await page.waitForSelector('[role="dialog"]');
    await page.waitForTimeout(400);
  },
});

await browser.close();
console.log("done");
