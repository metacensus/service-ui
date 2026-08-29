import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Dev-server-only vars (no VITE_ prefix → not exposed to the client bundle).
  // The dev server stands in for the consumer's reverse proxy, putting the API
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.API_PROXY_TARGET || "http://localhost:3001";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        canvas: path.resolve(__dirname, "./src/lib/empty-module.ts"),
      },
      // Force a single React instance. The PDF viewer stack is lazy-loaded, and
      // without deduping Vite can resolve a second copy of React for it,
      // producing the "Should have a queue. This is likely a bug in React" crash.
      dedupe: ["react", "react-dom"],
    },
    server: {
      proxy: {
        "/metacensus": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      exclude: ["canvas"],
      // navigating to the extraction page doesn't trigger a mid-session
      // re-optimization + reload.
    },
  };
});
