import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ["@mastra/core", "@mastra/openai"] // 避免打包
    }
  },
  optimizeDeps: {
    exclude: ["@mastra/core", "@mastra/openai"] // 让 Vite 不去解析
  }
});
