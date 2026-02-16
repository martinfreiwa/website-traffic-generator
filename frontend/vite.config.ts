import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '127.0.0.1',
      proxy: {
        '/auth': 'http://localhost:8000',
        '/users': 'http://localhost:8000',
        '/projects': 'http://localhost:8000',
        '/admin': 'http://localhost:8000',
        '/transactions': 'http://localhost:8000',
        '/tickets': 'http://localhost:8000',
        '/notifications': 'http://localhost:8000',
        '/settings': 'http://localhost:8000',
        '/subscriptions': 'http://localhost:8000',
        '/create-payment-intent': 'http://localhost:8000',
        '/webhooks': 'http://localhost:8000',
        '/broadcasts': 'http://localhost:8000',
        '/bank-transfer': 'http://localhost:8000',
        '/tools': 'http://localhost:8000',
        '/health': 'http://localhost:8000',
        '/stats': 'http://localhost:8000',
        '/start': 'http://localhost:8000',
        '/stop': 'http://localhost:8000',
        '/proxy': 'http://localhost:8000',
      },
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
