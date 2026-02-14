import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // DEBUG: Log loaded environment variables
    console.log(`[vite.config.ts] Running in mode: ${mode}`);
    console.log('[vite.config.ts] Loaded environment variables:');
    console.log('  VITE_ADMIN_SECRET:', env.VITE_ADMIN_SECRET ? '***SET***' : 'NOT SET');
    console.log('  VITE_API_BASE_URL:', env.VITE_API_BASE_URL || 'undefined');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
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
