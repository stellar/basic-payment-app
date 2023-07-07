<script>
    import Navbar from "./components/Navbar.svelte"
    import Drawer from "./components/Drawer.svelte";
    import Footer from "./components/Footer.svelte"
</script>

<div class="min-h-screen flex flex-col">
    <Navbar />
    <Drawer>
        <slot />
    </Drawer>
    <Footer />
</div>
