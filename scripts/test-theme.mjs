import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { startServer } from "./serve.mjs";
import { themeChecks } from "./theme-checks.mjs";

const preview = await startServer({ port: 0, root: fileURLToPath(new URL("../dist/", import.meta.url)) });
let browser;
try {
  browser = await chromium.launch();
  await themeChecks(browser, preview.url);
  console.log("Theme checks passed: early rendering, navigation, artwork, folders, responsive layouts, and blocked storage.");
} finally {
  await browser?.close();
  preview.server.close();
}
