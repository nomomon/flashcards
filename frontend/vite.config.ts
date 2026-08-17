import { execSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt", not "autoUpdate": a new service worker taking over mid-session
      // would reload the page under a learner part-way through a deck. The app
      // asks instead, and `src/pwa.ts` puts that ask in a toast.
      registerType: "prompt",
      injectRegister: false,

      /*
       * The plugin adds every manifest icon to the precache by default, and does
       * so after `globIgnores` and `manifestTransforms` have run - so neither can
       * remove them. This flag is the only lever.
       *
       * Worth pulling: the operating system fetches these once, when installing
       * the app, so keeping them for offline use buys nothing, and they were 414
       * KiB of a 1193 KiB precache. They are still built and served - just not
       * stored twice.
       *
       * The mistake was invisible from the build output, because the size the
       * plugin prints does not include the icons it adds this way: it read
       * "778 KiB" while the worker was really caching 1193. Summing the entries in
       * the generated sw.js is the check that catches it.
       */
      includeManifestIcons: false,

      manifest: {
        id: "/",
        name: "Flashcards",
        short_name: "Flashcards",
        description: "A simple flashcards app for learning languages.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        // Unchanged from the existing <meta name="theme-color">: installing the
        // app should not restyle it.
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          // The same artwork serves as maskable: its content sits within ±370px
          // of centre on a 1040px canvas, inside the 416px safe circle, and the
          // field behind it is flat colour - so a mask can crop the corners
          // without eating anything.
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        // Fonts are the reason woff2 is here; without it the app installs and
        // then falls back to a system font offline.
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        /*
         * Drop the apple-touch icon from the precache, for the same reason as the
         * manifest icons above: iOS reads it when adding to the home screen, not
         * on every visit. Favicons stay - a few KiB, and the browser asks for them
         * constantly.
         *
         * Done by filtering the manifest rather than with `globIgnores`, which
         * silently failed to match `icons/` with either `icons/**` or `icons/*`
         * while working fine for a root-level filename. This says exactly what it
         * excludes. The icons themselves need `includeManifestIcons: false`
         * above; no transform can reach them.
         */
        manifestTransforms: [
          (entries) => ({
            manifest: entries.filter(
              (entry) =>
                !entry.url.startsWith("icons/") &&
                entry.url !== "apple-touch-icon.png",
            ),
            warnings: [],
          }),
        ],
        // Client-side routes have no files behind them, so a navigation to
        // /deck/dutch-4 has to resolve to the shell. Data requests are not
        // navigations, but the denylist makes that explicit rather than implied.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/data\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // The freshness oracle. It decides whether cached decks are stale,
            // so serving it from cache would defeat the whole mechanism.
            urlPattern: ({ url }) => url.pathname === "/data/manifest.json",
            handler: "NetworkFirst",
            options: {
              cacheName: "flashcards-manifest",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 1 },
            },
          },
          {
            // Banks must NOT be cache-first. A bank lives at a stable URL
            // (banks/<id>.tsv) while its contents change, so a cache-first
            // worker would keep answering with last week's words no matter how
            // correctly the app noticed the new revision.
            urlPattern: ({ url }) => url.pathname.startsWith("/data/banks/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "flashcards-banks",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 32 },
            },
          },
          {
            // Audio filenames are content hashes, so a given URL can only ever
            // hold one clip. That is what makes cache-first safe here, and it is
            // the one place it is.
            urlPattern: ({ url }) =>
              /^\/data\/audio\/.+\.ogg$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "flashcards-audio",
              expiration: {
                maxEntries: 2000,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // The clip index changes whenever audio is generated.
            urlPattern: ({ url }) => url.pathname === "/data/audio/index.json",
            handler: "NetworkFirst",
            options: {
              cacheName: "flashcards-audio-index",
              expiration: { maxEntries: 1 },
            },
          },
        ],
      },

      devOptions: {
        // Off by default: a service worker in front of the dev server caches the
        // very files being edited. Set VITE_PWA_DEV=1 to test install flows.
        enabled: process.env.VITE_PWA_DEV === "1",
        type: "module",
      },
    }),
  ],
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
