const daisyui = require('daisyui')
const typography = require('@tailwindcss/typography')

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/routes/**/*.{html,js,svelte,ts}',
        './src/routes/**/**/*.{html,js,svelte,ts}',
        './src/lib/components/**/*.{html,js,svelte,ts}',
    ],
    plugins: [typography, daisyui],
}
