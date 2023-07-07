<script>
    import Sidebar from "./Sidebar.svelte";
</script>

<div class="drawer lg:drawer-open grow">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
        <main class="prose max-w-full p-6">
            <slot />
        </main>
    </div>
    <div class="drawer-side lg:h-auto z-10">
        <label for="drawer-toggle" class="drawer-overlay"></label>
        <Sidebar />
    </div>
</div>
