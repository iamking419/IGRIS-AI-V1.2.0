import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    // 🔥 Critical for correct asset loading in production
    base: "/",

    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        // ✅ Proper alias to src folder
        "@": path.resolve(__dirname, "src"),
      },
    },

    server: {
      // Dev hot reload control (safe)
      hmr: process.env.DISABLE_HMR !== "true",

      // Disable watch only when explicitly needed (AI environments)
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },

    build: {
      // 🔥 Ensures clean production output
      outDir: "dist",

      // Helps prevent broken long asset caching issues
      assetsDir: "assets",

      // Safer builds for deployment
      sourcemap: false,

      // Prevents weird chunk splitting issues on some hosts
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  };
});
