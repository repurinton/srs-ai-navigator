import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Static, serverless build — output is a self-contained set of files
// that can be hosted on any static host (S3/CloudFront, Netlify, GitHub Pages).
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
  },
});
