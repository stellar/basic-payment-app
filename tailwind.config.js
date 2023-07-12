const daisyui = require('daisyui')
const forms = require('@tailwindcss/forms')
const typography = require('@tailwindcss/typography')

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/routes/**/*.{html,js,svelte,ts}',
        './src/lib/components/**/*.{html,js,svelte,ts}',
    ],
    plugins: [forms, typography, daisyui],
}
