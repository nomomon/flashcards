import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Custom domain (flashcards.nomomon.xyz) serves the app from the domain root,
 * so `base` stays "/". The deck/audio data lives in the repo's `data/` folder
 * and is copied to `dist/data` by scripts/postbuild.mjs, which is why the
 * default VITE_DATA_BASE_URL is same-origin.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Serve the repo-level data/ folder at /data during development so the app
    // uses the exact same URLs it will use in production.
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
