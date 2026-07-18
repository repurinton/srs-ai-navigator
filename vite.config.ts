import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The static output remains compatible with ordinary hosts. The post-build
// packaging step also emits a Cloudflare Workers entrypoint for Sites.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        // three.js caches independently from scene-code iterations; the chunk
        // is lazy-loaded so the other chapters never pay for it.
        manualChunks: { "three-vendor": ["three"] },
      },
    },
  },
});
