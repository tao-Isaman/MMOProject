import { defineConfig } from "vite";

// Static assets live in public/ (served at /assets/...); the game is plain TypeScript modules.
// kits.html is the gallery of the town kits (src/kits_main.ts).
export default defineConfig({
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
    rollupOptions: { input: { main: "index.html", kits: "kits.html" } },
  },
});
