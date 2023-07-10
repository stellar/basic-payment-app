<script>
    import Sidebar from './Sidebar.svelte'
</script>

<div class="drawer grow lg:drawer-open">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col">
        <main class="prose max-w-full p-6">
            <slot />
        </main>
    </div>
    <div class="drawer-side z-10 lg:h-auto">
        <label for="drawer-toggle" class="drawer-overlay" />
        <Sidebar />
    </div>
</div>
