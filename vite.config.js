import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Rutas relativas: el build estático (dist/) funciona desde cualquier carpeta
  base: './',
  // Los Workers se crean con { type: 'module' } (useGeometryWorker.js)
  worker: { format: 'es' },
  server: {
    host: true,
    port: 5555,
    strictPort: true,
    // Polling para detectar cambios en ficheros montados desde el host
    watch: {
      usePolling: process.env.VITE_USE_POLLING === 'true',
      // El proyecto Python original solo es referencia: no hace falta vigilarlo
      ignored: ['**/_legacy/**'],
    },
  },
  preview: {
    host: true,
    port: 5555,
    strictPort: true,
  },
});
