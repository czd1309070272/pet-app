
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Polyfill __dirname for ESM environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
                        proxy: {
        // 将所有 /api 开头的请求代理到后端
        '/api': {
          target: 'http://localhost:8000', // 后端地址（开发时在本机）
          changeOrigin: true,             // 需要虚拟主机名
          rewrite: (path) => path.replace(/^\/api/, '/api') // 可选：保持 /api 前缀，如果后端路由就是 /api 开头的话可以不改
          // 如果你后端路由不带 /api 前缀，可以用下面这行去掉：
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
