import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [tailwindcss(), sveltekit()],
    test: {
        projects: [
            {
                extends: './vite.config.ts',
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: ['src/**/*.{test,spec}.{js,ts}'],
                    exclude: [
                        'src/**/*.svelte.{test,spec}.{js,ts}',
                        'src/**/*.integration.test.{js,ts}',
                        'tests/**/*.integration.test.{js,ts}',
                    ],
                    setupFiles: ['src/setupTest.ts'],
                },
            },

            // {
            //     extends: './vite.config.ts',
            //     test: {
            //         name: 'integration',
            //         environment: 'node',
            //         include: [
            //             'src/**/*.integration.test.{js,ts}',
            //             'tests/**/*.integration.test.{js,ts}',
            //         ],
            //         testTimeout: 30_000,
            //     },
            // }
        ],
    },
})
