import { defineConfig } from "vite";

// Static assets live in public/ (served at /assets/...); the game is plain TypeScript modules.
export default defineConfig({
  build: { target: "es2022", assetsInlineLimit: 0 },
});
