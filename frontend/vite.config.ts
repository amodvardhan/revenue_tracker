import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const frontendPort = Number(env.VITE_PORT ?? "5173");
  const backendBaseUrl = env.VITE_API_BASE_URL ?? "http://localhost:4000";

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        "/api": {
          target: backendBaseUrl,
          changeOrigin: true
        }
      }
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts"
    }
  };
});
