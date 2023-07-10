<script>
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
