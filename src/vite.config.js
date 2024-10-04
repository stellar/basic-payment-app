import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // @ts-ignore
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'], // Define dónde encontrar los tests
    environment: 'jsdom', // Simula un entorno de navegador
    globals: true, // Para usar 'describe', 'it', etc. sin importar en cada archivo
    setupFiles: './src/setupTest.js', // Opcional: puedes agregar un archivo de configuración para mocking u otras configuraciones globales
  },
});
