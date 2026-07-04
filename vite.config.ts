import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SPA fallback (Vite default appType "spa") serves index.html for
// /design/washa-ai/app and /design/washa-ai/dev during local dev/preview.
export default defineConfig({
  plugins: [react()],
});
