import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 从项目根目录加载环境变量
  const rootDir = path.resolve(__dirname, '..')
  const env = loadEnv(mode, rootDir, '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@common': path.resolve(__dirname, '../common'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 3001,
      open: true,
      proxy: {
        // 代理所有以 /auth、/admin、/api 开头的请求到后端
        '/auth': {
          target: env.VITE_API_DOMAIN || 'http://127.0.0.1:61000',
          changeOrigin: true,
        },
        '/admin': {
          target: env.VITE_API_DOMAIN || 'http://127.0.0.1:61000',
          changeOrigin: true,
        },
        '/api': {
          target: env.VITE_API_DOMAIN || 'http://127.0.0.1:61000',
          changeOrigin: true,
        },
      },
    },
    // 将环境变量注入到客户端
    define: {
      'import.meta.env.VITE_API_DOMAIN': JSON.stringify(env.VITE_API_DOMAIN || ''),
    },
  }
})

