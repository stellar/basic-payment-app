<script>
    /** @type {import('./$types').LayoutData} */
    export let data
    console.log('dashboard/+layout.svelte data', data)

    import Navbar from './components/Navbar.svelte'
    import Drawer from './components/Drawer.svelte'
    import Footer from './components/Footer.svelte'
    import { errorMessage } from '$lib/stores/alertsStore'

    /** @param {Event} err */
    function handleError(err) {
        console.log('here is the handleError err', err)
        errorMessage.set(err.error.body.message)
    }
</script>

<svelte:window on:error={handleError} />

<div class="flex min-h-screen flex-col">
    <Navbar />
    <Drawer>
        <slot />
    </Drawer>
    <Footer />
</div>
