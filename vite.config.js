import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const buildId = new Date().toISOString();

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "emit-version-json",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ buildId }, null, 2),
        });
      },
    },
  ],
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  base: "./",
  server: {
    port: 4320,
  },
  build: {
    outDir: "docs", // GitHub Pages can serve directly from /docs on main branch
    emptyOutDir: true,
  },
});
