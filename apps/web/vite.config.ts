import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(() => {
  // Deployment configuration selects the mount point; local development stays at /.
  const base = `${(process.env.APP_BASE_PATH ?? "/").replace(/\/+$/, "")}/`;
  const apiPrefix = `${base}api`;

  return {
    base,
    // Vercel serves dist from the domain root; put deployed files at the app mount.
    build: { outDir: process.env.VERCEL === "1" ? `dist${base}` : "dist" },
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        [apiPrefix]: {
          target: "http://localhost:3001",
          changeOrigin: true,
          rewrite: (path) => path.slice(apiPrefix.length) || "/",
        },
      },
    },
  };
});
