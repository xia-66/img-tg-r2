import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// 读取服务器端口配置，与server.js保持一致
const SERVER_PORT = process.env.PORT || 33000

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router'],
      dts: true
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: true
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${SERVER_PORT}`,
        changeOrigin: true
      },
      '/uploads': {
        target: `http://127.0.0.1:${SERVER_PORT}`,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})
