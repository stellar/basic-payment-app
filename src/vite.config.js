import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // @ts-ignore
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'], 
    environment: 'jsdom', 
    globals: true, 
    setupFiles: './src/setupTest.js', 
  },
});
