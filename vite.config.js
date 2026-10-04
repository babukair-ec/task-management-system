import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// 4 Microservices Routing:
// 1. User Management (Django)    -> http://localhost:8001
// 2. Employees (Django)          -> http://localhost:8002
// 3. Task Management (Node.js)   -> http://localhost:5001
// 4. Problem Management (Node.js)-> http://localhost:5002

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/employees': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/tasks': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/task-requests': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/problems': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
});
