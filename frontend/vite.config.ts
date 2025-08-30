import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
// import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || (process.env.NODE_ENV === 'production' ? '/mendian/' : '/'),
  plugins: [
    react(),
    // Bundle 分析器（仅在分析模式下启用）
    // process.env.ANALYZE === 'true' && visualizer({
    //   filename: 'dist/stats.html',
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true
    // })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared'),
    }
  },
  server: {
    port: 7800,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:7900',
        changeOrigin: true,
        secure: false
      }
    },
    fs: {
      strict: false
    }
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          // 第三方库分离
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          icons: ['@ant-design/icons'],
          charts: ['@ant-design/plots'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          utils: ['lodash-es', 'dayjs', 'axios'],
          excel: ['xlsx'],
          crypto: ['js-md5', 'js-sha1']
        },
        // 文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // 生产环境优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
})