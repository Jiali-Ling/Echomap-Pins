import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",

      // public 目录里的静态资源，想让它一定进缓存就放这里
      includeAssets: ["landing.png", "vite.svg", "iconDWT-192.png", "iconDWT-512.png"],

      manifest: {
        name: "EchoMap Pins",
        short_name: "EchoMap",
        description: "Local-first place story cards (photo + GPS + story), view offline.",
        theme_color: "#151412",
        background_color: "#fff7e6",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "iconDWT-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "iconDWT-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "iconDWT-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // 把打包产物都缓存（js/css/html/svg/png等）
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,json,txt}"],

        runtimeCaching: [
          // 图片�?CacheFirst：离线也能看�?landing + 卡片缩略图（如果在静态资源里/已缓存）
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
          },          // Leaflet map tiles - StaleWhileRevalidate for better offline experience
          {
            urlPattern: /^https:\/\/(.*\.)?tile\.openstreetmap\.org\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "osm-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // CartoDB tiles (dark/light themes)
          {
            urlPattern: /^https:\/\/(.*\.)?basemaps\.cartocdn\.com\/.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "cartodb-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Leaflet CSS and assets
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
          },        ],
      },

      // 开发阶段可开可不开；真正验收建议用 build+preview
      devOptions: {
        enabled: true,
      },
    }),
  ],
});

