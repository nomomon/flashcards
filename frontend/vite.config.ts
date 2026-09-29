import { execSync } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { normalizeDataBaseUrl } from "./src/lib/data/source";

/** The repo root, one level up from this Vite root. */
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const localDataDir = path.join(repoRoot, "data");

const isAbsoluteBase = (base: string) => /^https?:\/\//i.test(base);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A service-worker route matching `<data base>/<suffix>`.
 *
 * A RegExp rather than the `({ url }) => ...` form the rest of workbox's docs
 * favour, and that is the whole point: workbox-build writes `runtimeCaching`
 * into `sw.js` by stringifying it, so a function loses every variable it closed
 * over and the generated worker throws on its first fetch. A RegExp's source is
 * self-contained, so the base can be baked in.
 *
 * Matching is against the full href, since a cross-origin base has no useful
 * `pathname`. For a relative base the origin is left open - the site is served
 * from exactly one, and pinning it would mean knowing the domain here.
 */
function dataRoute(base: string, suffix: string): RegExp {
  const prefix = isAbsoluteBase(base)
    ? escapeRegExp(base)
    : `https?://[^/]+${escapeRegExp(base)}`;
  return new RegExp(`^${prefix}/${suffix}$`);
}

const DATA_CONTENT_TYPES: Record<string, string> = {
  ".json": "application/json; charset=utf-8",
  ".tsv": "text/tab-separated-values; charset=utf-8",
};

/**
 * Serves the repo's `data/` folder at the data base during `vite dev`.
 *
 * Vite's static server only ever serves `publicDir` and the Vite root, and
 * `data/` is neither - it lives a level up so that the tools and the app can
 * share one copy. `server.fs.allow` does not help: it widens what `/@fs/` may
 * reach, it does not mount anything. Without this the dev server answers every
 * deck request with the SPA shell, and the app reports the HTML as invalid
 * JSON.
 */
function serveLocalData(mountPath: string): Plugin {
  return {
    name: "flashcards:serve-local-data",
    apply: "serve",
    configureServer(server) {
      // Connect strips the mount path from req.url for us.
      server.middlewares.use(mountPath, (request, response) => {
        const requested = decodeURIComponent(
          (request.url ?? "/").split("?")[0],
        );
        const absolute = path.join(localDataDir, requested);
        // `data/` is the only thing this mount may read, whatever the URL says.
        // A miss is a 404 rather than `next()`, which would hand the request to
        // the SPA fallback: the app would then be told its manifest is HTML,
        // instead of that the file is not there.
        if (
          !absolute.startsWith(localDataDir + path.sep) ||
          !existsSync(absolute) ||
          !statSync(absolute).isFile()
        ) {
          response.statusCode = 404;
          response.end(`Not found under data/: ${requested}`);
          return;
        }
        response.setHeader(
          "Content-Type",
          DATA_CONTENT_TYPES[path.extname(absolute)] ??
            "application/octet-stream",
        );
        // Dev reads straight from disk; a cached bank would hide an edit.
        response.setHeader("Cache-Control", "no-store");
        createReadStream(absolute).pipe(response);
      });
    },
  };
}

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
 * so `base` stays "/".
 *
 * Where the decks come from is the one thing that is configurable, via
 * `VITE_DATA_BASE_URL`. It defaults to same-origin `/data`, which is the repo's
 * own `data/` folder copied into the build by scripts/postbuild.mjs. Pointed at
 * an absolute URL instead, the deployed app reads decks published from
 * somewhere else entirely and this repo's `data/` becomes an example. Both the
 * service worker's caching rules and the dev-time mount below are derived from
 * it, so there is one answer to "where is the data" rather than three.
 *
 * `envDir` is the repo root because that is where `.env.example` lives, and a
 * `.env` the example does not describe is a trap.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "VITE_");
  const dataBase = normalizeDataBaseUrl(env.VITE_DATA_BASE_URL);
  const dataIsRemote = isAbsoluteBase(dataBase);

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Nothing to serve locally when the decks live on another origin; the dev
      // server then reads exactly what production reads.
      ...(dataIsRemote ? [] : [serveLocalData(dataBase)]),
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
          // Matches <meta name="theme-color"> and --background in index.css. A
          // manifest takes one value, so this is the light one: the splash it
          // paints should look like the app opening, not like a different app.
          theme_color: "#fcfdff",
          background_color: "#fcfdff",
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
            // Its own file rather than the `any` artwork reused. The mark now
            // fills its square edge to edge, so a maskable crop would bite into
            // the glyphs; this variant scales the mark to 74% and lets the ground
            // take the crop, keeping everything inside the 80% safe circle.
            {
              src: "/icons/icon-maskable-512.png",
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
                  entry.url !== "apple-touch-icon.png" &&
                  entry.url !== "social.jpg",
              ),
              warnings: [],
            }),
          ],
          // Client-side routes have no files behind them, so a navigation to
          // /deck/example has to resolve to the shell. Data requests are not
          // navigations, but the denylist makes that explicit rather than
          // implied. It stays same-origin-shaped because a remote base is never
          // a navigation this worker sees.
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/data\//],
          cleanupOutdatedCaches: true,
          /*
           * Both rules are NetworkFirst and both are keyed off `dataBase`, so
           * they follow the decks wherever they are published. A cross-origin
           * base needs the server to send `Access-Control-Allow-Origin`, which
           * GitHub Pages does for every static file; without it the fetch fails
           * in the page long before the worker is asked to cache anything.
           *
           * `statuses: [200]` is deliberate. Caching status 0 would mean
           * caching opaque responses, and an opaque response cannot be told
           * apart from a failure - the worker would happily serve a cached
           * error forever.
           */
          runtimeCaching: [
            {
              // The freshness oracle. It decides whether cached decks are stale,
              // so serving it from cache would defeat the whole mechanism.
              urlPattern: dataRoute(dataBase, "manifest\\.json"),
              handler: "NetworkFirst",
              options: {
                cacheName: "flashcards-manifest",
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 1 },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              // Banks must NOT be cache-first. A bank lives at a stable URL
              // (banks/<id>.tsv) while its contents change, so a cache-first
              // worker would keep answering with last week's words no matter how
              // correctly the app noticed the new revision.
              urlPattern: dataRoute(dataBase, "banks/[^/]+\\.tsv"),
              handler: "NetworkFirst",
              options: {
                cacheName: "flashcards-banks",
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 32 },
                cacheableResponse: { statuses: [200] },
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
    // `.env.example` lives at the repo root, so `.env` has to be read from there
    // too - the default would look for it in frontend/ and find nothing.
    envDir: repoRoot,
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
      // The repo root, so a source map can point at a file outside frontend/.
      // Serving data/ is the `serveLocalData` plugin's job, not this setting's.
      fs: { allow: [repoRoot] },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
