import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SPA fallback (Vite default appType "spa") serves index.html for
// /design/washa-ai/app and /design/washa-ai/dev during local dev/preview.
// character-lab.html is a second, standalone entry (procedural creature lab).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        lab: fileURLToPath(new URL("./character-lab.html", import.meta.url)),
      },
    },
  },
});
