import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["vite.svg"],

      manifest: {
        name: "Green Guardian",
        short_name: "Guardian",
        description: "Local-first place story cards (photo + GPS + story), view offline.",
        theme_color: "#151412",
        background_color: "#fff7e6",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [],
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,json,txt}"],

        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /^https:\/\/(.*\.)?tile\.openstreetmap\.org\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "osm-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {

            urlPattern: /^https:\/\/(.*\.)?basemaps\.cartocdn\.com\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "cartodb-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "leaflet-assets",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});

