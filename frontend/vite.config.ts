import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // 从环境变量读取端口号，默认为 5000
      port: parseInt(env.VITE_PORT || '5000'),
      proxy: {
        // 代理 API 请求到后端
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5100',
          changeOrigin: true,
        },
      },
    },
  }
})
