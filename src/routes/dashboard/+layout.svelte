<script>
    /**
     * @description If a directory contained within `/src/routes/` contains a
     * `+layout.svelte` file, that file will act as a "container" for everything
     * else nested beneath that directory.
     * @see {@link https://kit.svelte.dev/docs/routing#layout-layout-svelte}
     */

    // `export let data` in a Svelte layout will load data returned by the
    // file's accompanying `+layout.js` file. The data here will then be
    // available to this layout, the corresponding `+page.svelte`, andy any
    // `+layout.svelte` files nested underneath this directory. (It should be
    // noted, we aren't actually _doing_ anything with the `data` in this
    // layout, except logging it to the console. You could safely delete these
    // lines, and the loaded data would still flow down to where it's needed.)
    /** @type {import('./$types').LayoutData} */
    export let data
    console.log('routes/dashboard/+layout.svelte data', data)

    import Navbar from './components/Navbar.svelte'
    import Drawer from './components/Drawer.svelte'
    import Footer from './components/Footer.svelte'
</script>

<div class="flex min-h-screen flex-col">
    <Navbar />
    <Drawer>
        <!-- A `<slot />` is the Svelte way of rendering this layout's child component(s) -->
        <slot />
    </Drawer>
    <Footer />
</div>
