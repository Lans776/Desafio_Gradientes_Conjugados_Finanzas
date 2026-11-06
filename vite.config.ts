import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// base './' permite desplegar en GitHub Pages (subruta), Netlify o Vercel sin cambios.
export default defineConfig({
  base: '/Desafio_Gradientes_Conjugados_Finanzas/',
  plugins: [react()],
});
