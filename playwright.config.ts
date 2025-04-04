import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "src/test",
  use: {
    baseURL: "http://localhost:3000", // dev server port
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
});
