import { execSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Identifies the deployed build. The commit is the only identifier that cannot
 * drift from what is actually running, which is why package.json's `version` is
 * not used here and is not bumped per commit.
 *
 * In CI, GITHUB_SHA is authoritative — the checkout may be detached or shallow,
 * and Actions knows the ref better than git does locally.
 */
function resolveCommit(): string {
  const fromCi = process.env.GITHUB_SHA;
  if (fromCi) return fromCi.slice(0, 7);
  try {
    return execSync("git rev-parse --short=7 HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    // No git (a tarball build, a fresh container). Not worth failing over.
    return "unknown";
  }
}

/**
 * Custom domain (flashcards.nomomon.xyz) serves the app from the domain root,
 * so `base` stays "/". The deck/audio data lives in the repo's `data/` folder
 * and is copied to `dist/data` by scripts/postbuild.mjs, which is why the
 * default VITE_DATA_BASE_URL is same-origin.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  define: {
    __APP_COMMIT__: JSON.stringify(resolveCommit()),
    __BUILT_AT__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    // Fail loudly instead of wandering to 3001: a bookmarked port that silently
    // moves is worse than a clear "port in use".
    strictPort: true,
    // Serve the repo-level data/ folder at /data during development so the app
    // uses the exact same URLs it will use in production.
    fs: { allow: [fileURLToPath(new URL("..", import.meta.url))] },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
