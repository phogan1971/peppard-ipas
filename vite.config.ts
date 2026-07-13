import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    // PORT lets the preview harness assign a free port when 5184 is taken
    // (e.g. two sessions on this folder); default stays 5184.
    port: Number(process.env.PORT) || 5184,
  },
});
