import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cloudflare Pages 会处理 functions 目录，前端部分照常打包
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
