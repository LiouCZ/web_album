import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const playwrightRequire = process.env.PLAYWRIGHT_MODULE_DIR
  ? createRequire(path.join(process.env.PLAYWRIGHT_MODULE_DIR, "package.json"))
  : require;
const { chromium } = playwrightRequire("playwright");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultChromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function collectPageErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function run() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE || defaultChromePath,
  });

  try {
    await assertHomeLinksToPlayerAlbum(browser);
    await assertPlayerAlbumRendersEmptyGallery(browser);
  } finally {
    await browser.close();
  }
}

async function assertHomeLinksToPlayerAlbum(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = await collectPageErrors(page);

  await page.goto(`file://${path.join(root, "index.html")}`);

  const officialLink = page.getByRole("link", { name: "官方画册" });
  const playerLink = page.getByRole("link", { name: "玩家分享" });
  await expectVisible(officialLink, "official album nav link should be visible");
  await expectVisible(playerLink, "player album nav link should be visible");
  assert.equal(await playerLink.getAttribute("href"), "player.html");
  assert.deepEqual(errors, []);

  await page.close();
}

async function assertPlayerAlbumRendersEmptyGallery(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = await collectPageErrors(page);

  await page.goto(`file://${path.join(root, "player.html")}`);

  assert.equal(await page.locator("h1").textContent(), "Belongs 玩家分享画册");
  await expectVisible(page.getByRole("link", { name: "官方画册" }), "official album nav link should be visible");
  await expectVisible(page.getByRole("link", { name: "玩家分享" }), "player album nav link should be visible");
  await expectVisible(page.getByRole("searchbox"), "search input should remain available");
  assert.equal(await page.locator("#totalCount").textContent(), "0");
  assert.equal(await page.locator("#visibleCount").textContent(), "0");
  assert.match(await page.locator("#summaryText").textContent(), /找到 0 组图文，0 张图片/);
  assert.equal(await page.locator("#emptyState h2").textContent(), "暂无玩家分享图文");
  assert.deepEqual(errors, []);

  await page.close();
}

async function expectVisible(locator, message) {
  assert.equal(await locator.count(), 1, message);
  assert.equal(await locator.isVisible(), true, message);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
