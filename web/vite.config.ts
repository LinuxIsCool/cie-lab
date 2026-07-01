import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5180,
    // P6 ask-server (analysis/serve.py) — same-origin /api, no CORS
    proxy: { "/api": "http://127.0.0.1:5181" },
  },
});
