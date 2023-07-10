<script>
    /** @type {import('./$types').LayoutData} */
    export let data
    console.log('dashboard/+layout.svelte data', data)

    import Navbar from './components/Navbar.svelte'
    import Drawer from './components/Drawer.svelte'
    import Footer from './components/Footer.svelte'
</script>

<div class="flex min-h-screen flex-col">
    <Navbar />
    <Drawer>
        <slot />
    </Drawer>
    <Footer />
</div>
