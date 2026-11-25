import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.VOCAB_WEB_URL || "http://127.0.0.1:5180",
    channel: "chrome",
    headless: true,
  },
});
