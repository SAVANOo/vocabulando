import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.VOCAB_API_URL || "http://127.0.0.1:4180";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: {
      "/api": apiTarget,
    },
  },
  preview: {
    port: 4185,
    proxy: {
      "/api": apiTarget,
    },
  },
});
