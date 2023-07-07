<script>
    import Navbar from "./components/Navbar.svelte"
    import Footer from "./components/Footer.svelte"
</script>

<div class="min-h-screen flex flex-col">
    <Navbar />
    <div class="drawer lg:drawer-open grow">
        <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content flex flex-col">
            <slot />

        </div>
        <div class="drawer-side lg:h-auto z-10">
            <label for="drawer-toggle" class="drawer-overlay"></label>
            <ul class="menu p-4 w-80 h-full bg-base-200 text-base-content">
                <li><a href="https://www.example.com">Sidebar Item 1</a></li>
                <li><a href="https://www.example.com">Sidebar Item 2</a></li>
            </ul>
        </div>
    </div>
    <Footer />
</div>
